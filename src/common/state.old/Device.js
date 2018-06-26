/****************************************************************************
/* FILE:                Device.js                            			    */
/* DESCRIPTION:         class to represent a device in a synchronisation    */
/*						session state.							            */
/* VERSION:             (see git)                                       	*/
/* DATE:                (see git)                                       	*/
/* AUTHOR:              Rajiv Ramdhany <rajiv.ramdhany@bbc.co.uk>    		*/

/* Copyright 2015 British Broadcasting Corporation							*/

/* Unless required by applicable law or agreed to in writing, software		*/
/* distributed under the License is distributed on an "AS IS" BASIS,		*/
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.	*/
/* See the License for the specific language governing permissions and		*/
/* limitations under the License.											*/
/****************************************************************************/

"use strict";

const Timeline = require("./Timeline");
const PersistedArrayContainer = require("./PersistedArrayContainer");
var redis = require("redis");

var PRIVATE = new WeakMap();

/**
 * @class Device 
 * 
 * @classdesc A simple class to represent a device in a session's 
 * state.
 * 
 * @constructor
 * @param {string} deviceId a device identifier
 * @param {string} sessionId the session this device belong's to
 * @param {string} contextId (optional) the context this device belongs to
 * @param {string} responseChannel a channel where the device listens to response messages
 * @param {array} timelines  an array of Timeline objects
 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
 *  * @param {string} requestChannel a channel where the device listens for request messages

 */
class Device
{
	// --------------------------------------------------------------------------
	// Lifecycle,  comparison methods
	// --------------------------------------------------------------------------

	constructor(deviceId, sessionId, contextId, responseChannel, timelines, ds, requestChannel)
	{

		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		this.id = deviceId;
		this.sessionId = sessionId;
		if (typeof contextId !=="undefined")
			this.contextId = contextId; 
		
		this.responseChannel = responseChannel;
		this.requestChannel = (typeof requestChannel === "undefined") ? ("Sessions/" + sessionId + "/devices/" + deviceId + "/REQ") : requestChannel;

		priv.key = "session:" + sessionId + ":device:" + this.id;

		//console.log("DEVICE constructor key: " + priv.key);

		
		if (typeof ds =="undefined")
			throw new Error("No datastore argument");

		priv.ds = ds;

		priv.timelinesContainer = new PersistedArrayContainer(timelines, Timeline, priv.ds, sessionId, Timeline.getFromDataStore);
		
	}

	// --------------------------------------------------------------------------

	/**
	 * Checks a Device object for equality
	 * @param {Device} anotherObj 
	 */
	equals(anotherObj)
	{
		
		if (!(anotherObj instanceof Device))
		{
			console.log("anotherObj is not of type Device");
			return false;
		}

		if (anotherObj.timelines.length !== this.timelines.length)
		{
			return false;
		}

			
		let result = (	anotherObj.id === this.id &&
						anotherObj.sessionId === this.sessionId &&
						anotherObj.contextId === this.contextId &&			
						anotherObj.channel === this.channel);
			
		if (!result)
		{
			return false;
		}


		this.timelines.sort(Timeline.sortFunction);
		anotherObj.timelines.sort(Timeline.sortFunction);
	
		for (let i = 0; i< this.timelines.length - 1; i++)
		{
			console.log("Device.equals: typeof this.timelines[i] ", typeof this.timelines[i]);
			console.log("Device.equals: typeof anotherObj.timelines[i] ", typeof anotherObj.timelines[i]);

			if((this.timelines[i] instanceof Timeline) && (anotherObj.timelines[i] instanceof Timeline))
			{		
				if (!(this.timelines[i].equals(anotherObj.timelines[i])))
					return false;
			}else if((typeof this.timelines[i] === "string") && (typeof anotherObj.timelines[i] === "string"))
			{
				if (this.timelines[i]!==anotherObj.timelines[i])
					return false;
			}else if((this.timelines[i] instanceof Timeline) && (typeof anotherObj.timelines[i] === "string"))
			{
				if (this.timelines[i].id !== anotherObj.timelines[i])
					return false;
			}else if((anotherObj.timelines[i] instanceof Timeline) && (typeof this.timelines[i] === "string"))
			{
				if (anotherObj.timelines[i].id !== this.timelines[i])
					return false;
			}
		}

		return true;
			
	}

	// --------------------------------------------------------------------------

	/**
	 * Sort callback function to pass to sort() method of an array
	 * @param {Device} a 
	 * @param {Device} b 
	 */
	static sortFunction(a, b)
	{
		if ((a instanceof Device) && (b instanceof Device))
		{
			return new String(a.id).localeCompare(b.id);
		}else if ((a instanceof Device) && (typeof b === "string"))
		{
			return new String(a.id).localeCompare(b);
		}else if ((b instanceof Device) && (typeof a === "string"))
		{
			return new String(b.id).localeCompare(a);
		}else if ( (typeof a === "string") && (typeof b === "string"))
		{
			return new String(a).localeCompare(b);
		}
		else
		{
			throw new Error("Incompatible types submitted to sortfunction");
		}
	}


	// --------------------------------------------------------------------------
	// Data store Context access methods
	// --------------------------------------------------------------------------

	/**
	 * Loads a Device object from the data store.
	 * @param {string} deviceId the device identifier
	 * @param {string} sessionId a parent id (used to generate the device fetch key)
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a Device object 
	 */
	static getFromDataStore(deviceId, sessionId, ds)
	{
		let key = "session:" + sessionId + ":device:" + deviceId;

		return new Promise((resolve, reject) =>{

			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");

			ds.getAsync(key).then((result)=>{
				
				if (typeof result!=="undefined" && result !==null)
				{
					let obj = JSON.parse(result);
					
					//console.log("Device.getfromds: result " + result);
					// lazy loading: timelines is a list of ids
					let t;
					if (typeof obj.requestChannel === "undefined"){
						t = new Device(obj.id, obj.sessionId, obj.contextId, obj.responseChannel, obj.timelines, ds);
					}else
						t = new Device(obj.id, obj.sessionId, obj.contextId, obj.responseChannel, obj.timelines, ds, obj.requestChannel);
					resolve(t);
						
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
	 * Checks if a device object with this deviceId and for this sessionId
	 * exists in the Redis data store
	 * @param {string} deviceId 
	 * @param {string} sessionId 
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns 
	 */
	static existsInDataStore(deviceId, sessionId, ds)
	{

		let key = "session:" + sessionId + ":device:" + deviceId;

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

	static deleteFromDataStore(deviceId, sessionId, ds)
	{
		let key = "session:" + sessionId + ":device:" + deviceId;
		
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
	 * Getter for timelines property
	 */
	get timelines()
	{
		var priv = PRIVATE.get(this);
		return priv.timelinesContainer.array;
	}


	// --------------------------------------------------------------------------

	set timelines(timelines)
	{
		var priv = PRIVATE.get(this);

		if (timelines instanceof PersistedArrayContainer)
			priv.timelinesContainer = timelines;
		else if (Array.isArray(timelines))
		{
			priv.timelinesContainer = new PersistedArrayContainer(timelines, Timeline, priv.ds, this.sessionId, Timeline.getFromDataStore);
			
		}

	}

	// --------------------------------------------------------------------------
	/**
	 * Retrieves this Device's list of timelines as a list of Timeline objects
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	getMyTimelines(ds)
	{
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object, RedisClient expected.");

		var self =this;

		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{

				var promises = [];
				for (let t of self.timelines)
				{
					if (typeof t === "string"){
						var p = Timeline.getFromDataStore(t, self.sessionId, ds);
						promises.push(p);
					}else if (t instanceof Timeline)
					{
						var q = Promise.resolve(t);
						promises.push(q);
					}
				}
				return Promise.all(promises);
			}).then((timelines)=>{
				resolve(timelines);
			}).catch((error)=>{reject(error);});
		});
	}

	// --------------------------------------------------------------------------
	/**
	 * Fetch a Timeline object for this identifier, if this timeline is registered
	 * in this device's list of timelines
	 * @param {string} timelineId a timeline identifier 
	 */
	getTimeline(timelineId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		
		return new Promise((resolve, reject) =>{

			// check if timeline exists in local state
			var findresult = self.findTimelineInLocalArray(timelineId);
			
			if ((findresult!==undefined) && (findresult instanceof Timeline))
			{
				resolve(findresult);
			}				
			else{
				Timeline.getFromDataStore(timelineId, self.sessionId, priv.ds).then((timeline)=>{
					if (timeline)
					{
						if (timeline.providerId === self.id)
						{
							// console.log("Test6: device id ", self.id);
							// console.log("Test6: fetch timeline from datastore: ", timeline.serialise());
							// if timeline was in datastore but not in local Context object state
							// add it to the local timeline list.
							if (findresult === undefined) 
							{
								self.timelines.push(timeline.id);
							}
							resolve(timeline);
						}
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
	 * Find index of timeline in this Device's local array of timelines
	 * @param {string} timelineId 
	 * @returns {int} index of device if found, else -1 is returned
	 */
	IndexOfTimelineInLocalArray(timelineId) {
		var findresult = this.timelines.findIndex(function (value) {
			if (value instanceof Timeline)
				return value.id === timelineId;
			else
				return value === timelineId;
		});
		return findresult;
	}

	// --------------------------------------------------------------------------

	/**
	 * Find timeline in this Device's local array of timelines
	 * @param {string} timelineId 
	 * @returns {Device} a Device object if found, else `undefined` is returned
	 */
	findTimelineInLocalArray(timelineId) {
		var findresult = this.timelines.find(function (value) {
			if (value instanceof Timeline)
				return value.id === timelineId;
			else
				return value === timelineId;
		});
		return findresult;
	}

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
	// Mutator Methods - changes this object's state
	// --------------------------------------------------------------------------
	


	/**
	 * 
	* @param {string} timelineId Identifier of this timeline
	* @param {string} sessionId This timeline's session
	* @param {string} contentId Optional identifier to associate this timeline to a contentId
	* @param {string} timelineType a timeline type identifier e.g. a URN
	* @param {string} channel address for the channel to listen to for this timeline's 
	* @param {string} providerId identifier of this timeline's provider (a Device or SyncController object)
	* @param {string} providerType timeline's provider type "Device" "SyncController" 
	* @param {boolean} useForSessionSync this timeline shall be considered for synchronising the whole session by the sync controller
 	* @param {boolean} writable this timeline can be changed by an external party (e.g. sync controller):
	 */


	addTimeline(timelineId, sessionId, contentId, timelineType, frequency, 
		channel, providerId, providerType, useForSessionSync, writable, parentTL, 
		parentTLCorr)
	{
		var priv = PRIVATE.get(this);
		var self = this;

		
		if (sessionId !== self.sessionId)
			throw new Error("SessionIds do not match");

		return new Promise((resolve, reject) =>{

			self.reload().then(()=>{
				// console.log("Device.addTimeline(): After Device.reload ",  self.serialise());
				var tl = self.findTimelineInLocalArray(timelineId);
				var index = self.IndexOfTimelineInLocalArray(timelineId);


				if (index!== -1)
				{
					// console.log("Device.addTimeline(): typeof tl ",  typeof tl);
					if (typeof tl === "string")
					{
						return self.getTimeline(tl);

					}else if (tl instanceof Timeline)
					{
						return self.getTimeline(tl.id);
					}	
				}else
				{
					var firstTimestamp = {
						contentTime: parentTLCorr.childTime,
						wallclockTime: parentTLCorr.parentTime,
						speed: parentTLCorr.speed,
						dispersion: parentTLCorr.initialError
					};
					// console.log("Device.addTimeline()");
					// console.log(firstTimestamp);
					var t = new Timeline(timelineId, sessionId, contentId, timelineType, frequency, channel, self.id, providerType, 
						useForSessionSync, writable, parentTL, parentTLCorr, firstTimestamp);
					// console.log(t);
					self.timelines.push(t);
					t.persist(priv.ds);
					
					
					// // console.log(self.timelines);
					// console.log("Device.addTimeline(): timeline added and persisted");
					// console.log("Device.addTimeline(): timeline: ",  self.serialise());
					// console.log("Device.addTimeline(): device: ",  self.serialise());

					console.log("timeline '", t.id ,"' added and saved.");

					return Promise.resolve(t.key());
				}
			}).then((timeline)=>{
				if (timeline)
				{
					// console.log("Device.addTimeline(): timeline ", timeline.id , " already in device timelines");
					timeline.contentId = contentId;
					timeline.timelineType = timelineType;
					timeline.channel = channel;
					timeline.providerId = providerId;
					timeline.providerType = providerType;										
					timeline.persist(priv.ds);		
				}
				self.persistAsync(priv.ds);
				return timeline;
				
			}).then((timeline)=>{
				console.log("Device.AddTimeline() result: ", timeline.key());
				resolve(timeline.key());
			}).catch(error=>{reject(error);});			

		});
	}

	// --------------------------------------------------------------------------

	/**
	 * remove a timeline from this device's list of timelines and cleanup its persisted state
	 * @param {string} timelineId a timeline identifier
	 */
	removeTimeline(timelineId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		var index = -1;

		return new Promise((resolve, reject) =>{

			self.reload().then(()=>{
				// check if device exists in local state
				var index = self.IndexOfTimelineInLocalArray(timelineId);
				var timeline_to_delete = self.findTimelineInLocalArray(timelineId);

				// console.log("Device.removeTimeline(): index=", index);
				// console.log(timeline_to_delete);
				if (index!== -1)
				{
				// device is in local state of this context object
				// thus we delete it from the data store and from this context's devices list
					if (typeof timeline_to_delete === "string")
					{
						return self.getTimeline(timeline_to_delete);

					}else if (timeline_to_delete instanceof Timeline)
					{
						return self.getTimeline(timeline_to_delete.id);
					}					
					
				}else{
				// check if datastore contains this device
					return Timeline.getFromDataStore(timelineId, self.sessionId, priv.ds);
				}
			}).then((timeline)=>
			{
				index = self.IndexOfTimelineInLocalArray(timelineId);
				if(index !== -1 ) 
				{
					// console.log("delete from device array");
					self.timelines.splice(index, 1);
				}

				if (timeline)
				{
					if (timeline.providerId == self.id)
					{
						timeline.cleanUp(priv.ds)
							.then((success)=>{								
								resolve(success);
							}).catch((error)=>{
								reject(error);
							});
					}
				}
				
				return self.persistAsync(priv.ds);
			}).then(()=>{
				resolve(true);
			}).catch((result)=>{
				reject(result);
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
		
		ds.set(this.key, this.serialise(), function(err, reply) {
			// reply is null when the key is missing
			//console.log(reply);
			for(let t in this.timelines)
			{
				if (t instanceof Timeline)
					t.persist(ds);
			}
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Persist this object to a Redis datastore.
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns true once the data persistence has successfully
	 * completed.
	 */
	persistAsync(ds)
	{
		var self = this;

		

		return new Promise((resolve, reject) =>{

			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");
			
			var promises = [];


			// persist this device object's timelines
			for (let t of self.timelines)
			{
				if (typeof t === "string")
				{
					var p =Timeline.existsInDataStore(t, self.sessionId, ds);
					promises.push(p);					
				}	
				else if (t instanceof Timeline)
				{
					var q = t.persistAsync(ds);
					promises.push(q);
				}
			}

			Promise.all(promises).catch((error)=>{
				reject(error);
			}).then((result)=>{
				if (result)
				{
					ds.setAsync(self.key, self.serialise()).then((result)=>{
						resolve(result);
						// console.log(">>>>>>>After Device.persistAsync ",  self.serialise());
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

	/**
	 * Delete this timeline from the datastore
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	cleanUp(ds)
	{
		var self =this;
		return new Promise((resolve, reject)=>{

			if (this.timelines.length > 0)
			{
				var promises = [];
	
				for (let t of self.timelines)
				{
					if (typeof t === "string")
					{
						var p =Timeline.deleteFromDataStore(t, self.sessionId, ds);
						promises.push(p);
						console.log("Device.cleanup(): cleaning timeline ", t);					
					}	
					else if (t instanceof Timeline)
					{
						var q = t.cleanUp(ds);
						console.log("Device.cleanup(): cleaning timeline ", t.id);
						promises.push(q);
					}
				}
				console.log("Device.cleanup(): cleaning device ", self.id);
				var z = Device.deleteFromDataStore(self.id, self.sessionId, ds);
				promises.push(z);
	
				Promise.all(promises).catch((error)=>{
					reject(error);
				}).then((result)=>{
					//console.log(result);
					// delete all timelines array content
					self.timelines.splice(0);
					resolve(true);
				});
			}else{ 
				// resolve immediately as there is nothing to cleanup
				resolve(true);
			}
		});
	}


	// --------------------------------------------------------------------------

	/**
	 * Reload this device's internal state from the datastore
	 */
	reload()
	{
		
		var self = this;
		var priv = PRIVATE.get(this);
		
		
		return new Promise((resolve, reject)=>{

			// retrieve this device's copy from the datastore
			// and update local fields
			Device.getFromDataStore(self.id, self.sessionId, priv.ds)
				.then((devicecopy)=>{
					if(devicecopy)
					{
						self.contextId = devicecopy.contextId;
						self.responseChannel = devicecopy.responseChannel;
						self.requestChannel = devicecopy.requestChannel;
						self.timelines = devicecopy.timelines; 
						var promises = [];
						for (let i=0; i<devicecopy.timelines.length;i++)
						{
							var p = self.timelines[i];
							promises.push(p);
						}

						return Promise.all(promises);						
					}else
					{
						// device not found in datastore
						self.persist(priv.ds);
						resolve(false);
					}

					// devicecopy to be garbage-collected
				}).then(()=>{
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
			sessionId: this.sessionId,
			contextId:  this.contextId,
			responseChannel: this.responseChannel,
			requestChannel: this.requestChannel,
			timelines: []
		};
		
		for (let t of this.timelines)
		{
			if (typeof t === "string")
				obj.timelines.push(t);
			else if (t instanceof Timeline)
				obj.timelines.push(t.id);
		}
		
		return JSON.stringify(obj);
	}

	// --------------------------------------------------------------------------


}


module.exports = Device;