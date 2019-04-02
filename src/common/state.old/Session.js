/****************************************************************************
/* FILE:                Session.js                            				*/
/* DESCRIPTION:         class for a synchronisation session                 */
/* VERSION:             (see git)                                       	*/
/* DATE:                (see git)                                       	*/
/* AUTHOR:              Rajiv Ramdhany <jonathan.rennison@bt.com>    	*/

/* Copyright 2015 British Broadcasting Corporation							*/

/* Unless required by applicable law or agreed to in writing, software		*/
/* distributed under the License is distributed on an "AS IS" BASIS,		*/
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.	*/
/* See the License for the specific language governing permissions and		*/
/* limitations under the License.											*/
/****************************************************************************/

"use strict";

const Timeline = require("./Timeline");

const Device = require("./Device");

const Context = require("./Context");

const PersistedArrayContainer = require("./PersistedArrayContainer");

var redis = require("redis");
var Logger = require("../logger/logger");

var PRIVATE = new WeakMap();

var logger = Logger.getNewInstance();

// TODO: subscribe to device and timeline changes in REDIS for devices/timelines
// this session object has inserted into REDIS and update own internal state.

/**
 * @class Session
 * 
 * @classdesc A synchronisation session state representation
 * 
 * @constructor
 * @param {string} sessionId Identifier of the synchronisation session
 * @param {list} contexts list synchronisation contexts
 * @param {list} syncTimelines a timelineId for this session's synchronisation timeline
 * 
 */ 
class Session
{
	// --------------------------------------------------------------------------
	// Lifecycle,  comparison methods
	// --------------------------------------------------------------------------

	constructor(sessionId, contexts, datastore, sessionLabel="no label")
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
		
		this.id =  sessionId;
		this.sessionLabel = sessionLabel;
		this.timelines = [];
		this.timelineSourceTypes = [];
		this.syncTimelines = [];

		priv.key = "session:" + sessionId;

		priv.stateChannel = "Sessions/" + sessionId + "/state";
		
		if (typeof datastore =="undefined")
			throw new Error("No datastore argument");
		
		priv.ds = datastore;
		priv.contextsContainer = new PersistedArrayContainer(contexts, Context, priv.ds, sessionId, Context.getFromDataStore); 
	}

	// --------------------------------------------------------------------------
	// Data store Context access methods
	// --------------------------------------------------------------------------

	/**
	 * Loads a Session object (representing the session's state) from the data store.
	 * Lazy-loading is used to load the relevant session state in memory.
	 *   
	 * @param {string} sessionId 
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a Context object 
	 */
	static getFromDataStore(sessionId, ds)
	{
		let key = "session:" + sessionId;


		return new Promise((resolve, reject) =>{
			
			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");
			
			ds.getAsync(key).then((result)=>{
		
				if (typeof result!=="undefined" && result !==null)
				{
					// console.log(result);
					let obj = JSON.parse(result);
					// console.log(obj);
					
					let s = new Session(obj.id, obj.contexts, ds, obj.sessionLabel);
					if (typeof obj.syncTimelines !== "undefined")
					{
						s.syncTimelines = obj.syncTimelines;
					}
					resolve(s);	
				}
				else
					resolve(null);
			}).catch((datastore_reply) =>{
				reject(datastore_reply);
			});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Checks if a Session object exists in the data store.
	 * @param {string} sessionId a session identifier
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a boolean value (true if session object
	 * exist else false)
	 * 
	 */
	static existsInDataStore(sessionId, ds)
	{
		let key = "session:" + sessionId;

		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");
			
			ds.existsAsync(key).then((result)=>{
				
				if (typeof result!=="undefined")
				{
					if (result > 0)
						resolve(true);	
					else
						resolve(false);
				}
				else
					reject(false);
			}).catch((datastore_reply) =>{
				reject(datastore_reply);
			});
		});

	}


	// --------------------------------------------------------------------------

	static deleteFromDataStore(sessionId, ds)
	{
		let key = "session:" + sessionId;
		
		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");
					
			ds.delAsync(key).then((result)=>{
						
				if (typeof result!=="undefined")
				{
					if (result >= 1)
						resolve(true);	
					else
						resolve(false);
				}
				else
					reject(false);
			}).catch((datastore_reply) =>{
				reject(datastore_reply);
			});
		});		
	}


	// --------------------------------------------------------------------------
	// Accessor methods
	// --------------------------------------------------------------------------

	/**
	 * Get this object's key used for storage.
	 */
	get key()
	{
		var priv = PRIVATE.get(this);
		return priv.key;
	}

	// --------------------------------------------------------------------------

	/**
	 * Getter for contexts property
	 */
	get contexts()
	{
		var priv = PRIVATE.get(this);
		return priv.contextsContainer.array;
	}


	// --------------------------------------------------------------------------

	set contexts(contexts)
	{
		var priv = PRIVATE.get(this);
		
		if (contexts instanceof PersistedArrayContainer)
			priv.devicesContainer = contexts;
		else if (Array.isArray(contexts))
		{
			priv.contextsContainer = new PersistedArrayContainer(contexts, Context, priv.ds, this.id, Context.getFromDataStore);	
		}
	}
	

	// --------------------------------------------------------------------------

	/**
	 * Retrieves this Session's local list of contexts as a list of Context objects
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	getMyContexts(ds)
	{
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object, RedisClient expected.");

		var promises = [];

		for (let c of this.contexts)
		{
			// console.log("Session.getMyContexts()");
			// console.log(c);
			if (typeof c === "string"){
				var p = Context.getFromDataStore(c, this.id, ds);
				promises.push(p);
			}else if (c instanceof Context)
			{
				var q = new Promise((resolve)=>{
					resolve(c);
				});
				promises.push(q);
			}
		}
		return Promise.all(promises);
	}

	// --------------------------------------------------------------------------

	/**
	 * 
	 * @param {string} contextId a sync context identifier
	 * @returns {Promise}  a Promise object that will return a Context object if found else
	 * 	the Promise object returns null
	 */
	getContext(contextId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		return new Promise((resolve, reject) =>{

			var ctx = self.findContextInLocalArray(contextId);

			if ((ctx!==undefined) && (ctx instanceof Device))
			{
				resolve(ctx);
			}				
			else{
				Context.getFromDataStore(contextId, this.id, priv.ds).then((context)=>{
					if (context)
					{
						//console.log(">>> " , context.serialise());
						if (context.sessionId=== self.id)
						{
							if (ctx === undefined) 
								self.contexts.push(context.id);
							// console.log(">>> " , context.serialise());
							resolve(context);
						}else
							resolve(null);
					}
					else
					{
						resolve(null);
					}
				}).catch((result)=>{
					reject(result);
				});
			}
		});
	}


	// --------------------------------------------------------------------------

	
	/**
	 * Find index of Context in Session object local array
	 * @param {string} contextId 
	 * @returns {int} index of context if found, else -1 is returned
	 */
	IndexOfContextInLocalArray(contextId) {
		var findresult = this.contexts.findIndex(function (value) {
			if (value instanceof Context)
				return value.id === contextId;
			else
				return value === contextId;
		});
		return findresult;
	}

	// --------------------------------------------------------------------------

	/**
	 * Find context in Session object local array
	 * @param {string} contextId 
	 * @returns {Context} a Context object if found, else `undefined` is returned
	 */
	findContextInLocalArray(contextId) {

		var findresult = this.contexts.find(function (value) {
			if (value instanceof Context)
			{
				return value.id === contextId;
			}				
			else{
				return value === contextId;
			}				
		});
		return findresult;
	}


	// --------------------------------------------------------------------------

	getDevices()
	{
		

		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			
			self.reload().then(()=>{

				
				var promises = [];
				for(let ctx of self.contexts)
				{
					var p = self.getContext(ctx);
					promises.push(p);
				}
				
				return Promise.all(promises);			
			}).then((contexts)=>{

				// console.log(contexts);

				if(contexts.length > 0)
				{
					
					var dev_promises = [];

					for(let ctx of contexts)
					{
						//console.log("Session.getDevices() 4: ctx instanceof Context ", ctx instanceof Context );
						var p = ctx.getMyDevices(priv.ds);
						dev_promises.push(p);
					}
					
					return Promise.all(dev_promises);	
				}else
				{
					var q = Promise.resolve([]);
					return Promise.all([q]);
				}
			}).then((deviceArrays)=>{
				
				// console.log("Session.getDevices() 5 deviceArrays: ");
				// console.log(deviceArrays);

				var flattenedArray = [].concat.apply([],deviceArrays);

				resolve(flattenedArray);
			}).catch((result)=>{reject(result);});
		});


	}



	getTimelines(queryOptions)
	{
		

		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			// console.log("Session.getDevices() 1 : ");

			self.reload().then(()=>{

				// console.log("Session.getDevices() 2 : ");
				var promises = [];
				for(let ctx of self.contexts)
				{
					var p = self.getContext(ctx);
					promises.push(p);
				}
				
				return Promise.all(promises);			
			}).then((contexts)=>{

				// console.log("Session.getDevices() 3: ");
				// console.log(contexts);

				if(contexts.length > 0)
				{
					
					var dev_promises = [];

					for(let ctx of contexts)
					{
						//console.log("Session.getTimelines() 4: ctx instanceof Context ", ctx instanceof Context );
						var p = ctx.getMyDevices(priv.ds);
						dev_promises.push(p);
					}
					
					return Promise.all(dev_promises);	
				}else
				{
					var q = Promise.resolve([]);
					return Promise.all([q]);
				}
			}).then((deviceArrays)=>{
				
				// console.log("Session.getDevices() 5 deviceArrays: ");
				// console.log(deviceArrays);

				var flattenedArray = [].concat.apply([], deviceArrays);

				var tl_promises = [];

				for (let dev of flattenedArray)
				{
					logger.debug("Session.getTimelines() : get timeline for device: ", dev.id );
					var q = dev.getMyTimelines(priv.ds);
					tl_promises.push(q);
				}

				return Promise.all(tl_promises);
				
			}).then((timelineArrays)=>{
				
				// console.log("Session.getTimelines() 5 timelineArrays: ");
				// console.log(timelineArrays);

				var flattenedTimelineArray = [].concat.apply([], timelineArrays);

				resolve(flattenedTimelineArray);
				
			}).catch((result)=>{reject(result);});
		});


	}


	// --------------------------------------------------------------------------

	/**
	 * Find a device in this session's local and persisted state.
	 * @param {string} deviceId device identifier
	 * @param {string} contextId Optional parameter. A context identifier
	 * @returns {Promise} A promise object that resolves to a Device object if the device is found.
	 * Else the promise resolves to null. If the promise fails, this means a processing failure
	 * such as failure to contact the datastore.
	 */
	findDevice(deviceId, contextId)
	{
		var self = this;

		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{
				if (contextId)
					return self.getContext(contextId);
				else
				{
					return Promise.resolve(null);
				}

			}).then((context)=>{
				
				if (!context)
				{
					var promises = [];
					
					for(let ctx of self.contexts)
					{
						var p = ctx.getDevice(deviceId);
						promises.push(p);
					}

					return promises.all(promises);

				}else
				{
					return context.getDevice(deviceId);
				}			
			}).then((devices)=>{
				
				if (!devices)
					resolve(null);
				
				if (devices instanceof Device)
					resolve(devices);
				else if (Array.isArray(devices))
				{
					for(let d of devices)
					{
						if ((d) && (d instanceof Device))
						{
							resolve(d);
							break;
						}
					}
				}

			}).catch(error=>{reject(error);});
		});
	}



	// --------------------------------------------------------------------------
	// Mutator Methods - changes this object's state
	// --------------------------------------------------------------------------  
	
	addContext(contextId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{
				// console.log("Session.addContext() 1");
				return self.getContext(contextId);
			}).then((context)=>{

				if (!context)
				{
					// console.log("Session.addContext() 2a");

					var new_ctx = new Context(contextId, self.id, [], priv.ds);
					self.contexts.push(new_ctx);
					context = new_ctx;	
					context.persist(priv.ds);
					return Promise.resolve(context, true);
				}else
				{
					// console.log("Session.addContext() 2b");
					return Promise.resolve(context, false);
				}
			}).then((context, created)=>{
				if (created)
					return self.persistAsync(priv.ds);
				else 
					return self.persistAsync(priv.ds);

			}).then((result)=>{
				resolve(true);
			}).catch(error=>{reject(error);});
		});
	}

	/**
	 * Adds a device to a context
	 * @param {string} deviceId 
	 * @param {string} responseChannel 
	 * @param {string} contextId 
	 */
	addDeviceToContext(deviceId, requestChannel, responseChannel, contextId)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{
				return self.getContext(contextId);
			}).then((context)=>{
				if (!context)
				{
					var new_ctx = new Context(contextId, self.id, [], priv.ds);
					self.contexts.push(new_ctx);
					context = new_ctx;	
					context.persist(priv.ds);
					return Promise.resolve(context, true);
				}else
					return Promise.resolve(context, false);
				
			}).then((context, created)=>{

				if (created)
					self.persist(priv.ds);

				return context.addDeviceIfNotExists(deviceId, requestChannel, responseChannel);
			
			}).then((result)=>{
				resolve(result);
			}).catch(error=>{reject(error);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Remove device from context and from datastore
	 */
	removeDeviceFromContext(deviceId, contextId)	
	{
		var self = this;
		
		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{
				return self.getContext(contextId);
			}).then((context)=>{
				if (context)
				{
					logger.info("Removed device from context '" , context.id, "'");
					return context.removeDevice(deviceId);
				}else
					return Promise.resolve(false);
				
			}).then((result)=>{
				resolve(result);
			}).catch(error=>{reject(error);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Register a new timeline in this session. It assumes that a device has been registered before.
	 * Timeline key is also added to session's timeline list. The timeline's [contentId, timelineType] is used
	 * as a tuple to differentiate between different sources of timelines. 
	 * @param {string} timelineId providerId
	 * @param {string} contentId content identifier
	 * @param {string} timelineType a URN string specifying a known type of timeline (see DVB-CSS specs)
	 * @param {string} channel channel (e.g. MQTT topic) where this timeline updates are pushed
	 * @param {string} providerId timeline's provider e.g. a deviceId
	 * @param {string} contextId context identifier, context the device belongs to (for faster device lookup)
	 * @param {boolean} useForSessionSync this timeline shall be considered for synchronising the whole session by the sync controller
 	 * @param {boolean} writable this timeline can be changed by an external party (e.g. sync controller):
	 * @returns {Promise}
	 */
	addTimeline(timelineId, contentId, timelineType, frequency, channel, providerId, contextId, useForSessionSync, writable, parentTL, parentTLCorr)
	{
		var self = this;
		
		return new Promise((resolve, reject) =>{
			
			self.findDevice(providerId, contextId)
				.catch((error)=>{ reject(error);})
				.then((device)=>{	
					// console.log("Session.addTimelineToDevice() device: ", device, " channel: ", channel);
					if(device)
					{	
						// console.log("Session.addTimelineToDevice() : ");
						// console.log(parentTLCorr);
						return device.addTimeline(timelineId, self.id, contentId, timelineType, 
							frequency, channel, providerId, "Device", useForSessionSync, writable, 
							parentTL, parentTLCorr);
					}else
					{
						return Promise.resolve(false);
					}
				}).then((timelineKey)=>{
					
					// add timeline 
					// TODO: 
					resolve(timelineKey);
				}).catch((error)=>{ reject(error);});
		});

	}


	
	// --------------------------------------------------------------------------

	/**
	 * Unregister a timeline from the specified device in this session
	 * @param {string} timelineId timeline identifier
	 * @param {string} deviceId device identifier
	 * @param {string} contextId context identifier, context the device belongs to (for faster device lookup)
	 */
	removeTimelineFromDevice(timelineId, deviceId, contextId)
	{
		var self = this;

		return new Promise((resolve, reject) =>{
			
			self.findDevice(deviceId, contextId)
				.catch((error)=>{ reject(error);})
				.then((device)=>{					
					if(device)
					{
						// found device
						try{
							device.removeTimeline(timelineId)
								.then(()=>{resolve(true);})
								.catch((error)=>{ reject(error);});
						}catch(e){
							reject(e);
						}
						
					}else
						// device not found in session
						resolve(false);
				});
		});

	}


	// --------------------------------------------------------------------------
	// State persistence methods
	// --------------------------------------------------------------------------

	/**
	 * Persist this object to a Redis datastore.
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	persist(ds)
	{
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object");
		// console.log("Session.persist()");
		// console.log(this.serialise());
		ds.set(this.key, this.serialise(), function(err, reply) {
			// reply is null when the key is missing
			console.log("session.persist(): ", reply);
			for(let c in this.contexts)
			{
				if (c instanceof Context)
					c.persist(ds);
			}
		});
	}


	/**
	 * Persist this object to a Redis datastore.
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns true once the data persistence has successfully
	 * completed.
	 */
	persistAsync(ds)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");
		
			var promises = [];
			
			for (let c of this.contexts)
			{
				if (typeof c === "string")
				{
					
					var p = Context.existsInDataStore(c, this.sessionId, ds);
					promises.push(p);
				}else if (c instanceof Context)
				{
					
					var q = c.persistAsync(ds);
					promises.push(q);
				}
			}

			Promise.all(promises).catch((error)=>{
				reject(error);
			}).then((result)=>{
			
				if (result)
				{
					//console.log(this.serialise());
					ds.setAsync(this.key, this.serialise()).then((result)=>{
						//console.log("SIX");
						resolve(result);
					}).catch((error)=>{
						
						reject(error);
					});
				}else
				{
					resolve(false);
				}
			});			
		});
	}

	// --------------------------------------------------------------------------

	reload()
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject)=>{
			// console.log("Session.reload() : 1");
			// console.log(self.serialise());
			Session.getFromDataStore(self.id, priv.ds)
				.then((sessioncopy)=>{
					// console.log("Session.reload() : 2");
					// console.log(sessioncopy);
					if (sessioncopy)
					{
						// console.log("Session.reload() : 3");
						self.contexts = sessioncopy.contexts;
						var promises = [];

						for (let i=0; i<self.contexts.length;i++)
						{
							var p = self.contexts[i];
							promises.push(p);
						}
						return Promise.all(promises);
					}else
					{
						self.persist(priv.ds);
						resolve(false);
					}

				}).then(()=>{
					// console.log("Session.reload() : 4");
					// console.log(self.serialise());
					resolve(true);
				})
				.catch((error)=>{
					// error retrieving from datastore, reject this operation
					reject(error);
				});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Return a string representation of this object
	 */
	serialise()
	{
		var obj = {
			id: this.id,
			sessionLabel: this.sessionLabel,
			contexts: [],
			syncTimelines : this.syncTimelines
		};

		for (let c of this.contexts)
		{
			if (typeof c === "string")
				obj.contexts.push(c);
			else if (c instanceof Context)
				obj.contexts.push(c.id);
		}
		
		return JSON.stringify(obj);
	}

	/**
	 * Delete this session from the datastore
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	cleanUp(ds)
	{
		var self =this;
		return new Promise((resolve, reject)=>{
			self.reload().then(()=>{
				return self.getMyContexts(ds);
			}).catch((error)=>{reject(error);
			}).then((contexts)=>{
				//console.log(contexts);
				if (contexts.length > 0)
				{
					var promises = [];
					for (let c of contexts)
					{
						if (c instanceof Context)
						{
							logger.info("context '", c.id, "' deleted");
							var q = c.cleanUp(ds);
							promises.push(q);
						}
					}
	
					return Promise.all(promises);
				}else
				{
					return Promise.resolve([true]);
				}				
			}).then((results)=>{
				// console.log("Session.cleanup(): session ", self.id, " cleaned");
				return Session.deleteFromDataStore(self.id, ds);
			}).then((result)=>{
				// console.log("in cleanup ", result);
				// delete all contexts array content
				self.contexts.splice(0);
				resolve(true);
			}).catch((error)=>{reject(error);
			});
		});
	}

	// --------------------------------------------------------------------------
}




module.exports = Session;