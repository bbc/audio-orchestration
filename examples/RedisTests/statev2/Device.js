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

const list = require("./List"); 
const Timeline = require("./Timeline");
var redis = require("redis");
var Logger = require("../logger/logger");
var log_level = "development"; 
var logger  = Logger.getNewInstance(log_level);

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
 * @param {string} contextId Optional. the context this device belong's to
 * @param {string} responseChannel a channel where the device listens to response messages
 * @param {string} requestChannel a channel where the device listens for request messages
 * @param {List} timelines  a list  of timelines persisted in Redis
 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 


 */
class Device
{
	// --------------------------------------------------------------------------
	// Lifecycle,  comparison methods
	// --------------------------------------------------------------------------

	constructor(deviceId, sessionId, contextId, responseChannel, requestChannel, ds, persist=false)
	{

		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		this.id 			= deviceId;
		this.sessionId 		= sessionId;
		if ((typeof contextId !=="undefined") && (contextId !== null))
			this.contextId 	= contextId;
			
		if ((typeof responseChannel !=="undefined") && (responseChannel !== null))
			this.responseChannel 	= responseChannel;

		this.requestChannel 	= (typeof requestChannel !=="undefined") && (requestChannel !== null) ? ("Sessions/" + sessionId + "/devices/" + deviceId + "/REQ") : requestChannel;

		priv.key = "session:" + sessionId + ":device:" + this.id;

		if (typeof ds === "undefined")
			throw new Error("No datastore argument");

		priv.ds = ds;
		var timelinesListKey = priv.key + ":timelines";

		this.timelines = list(timelinesListKey, priv.ds);
		
		if (persist) this.persist(priv.ds);
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
			logger.debug(anotherObj ," is not of type Device");
			return false;
		}

		if (anotherObj.timelines.length !== this.timelines.length)
		{
			return false;
		}

			
		let result = (	anotherObj.id === this.id &&
						anotherObj.sessionId === this.sessionId &&
						anotherObj.contextId === this.contextId &&			
						anotherObj.requestChannel === this.requestChannel);
			
		if (!result)
		{
			return false;
		}
		
		return true;
			
	}

	// --------------------------------------------------------------------------
	// Class-level methods
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
		if (!(ds instanceof redis.RedisClient))
			throw("data store object is not a RedisClient instance");

		return Device.deserialise(key, ds);
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
			
			ds.hexistsAsync(key, "id").then((result)=>{
				
				if (typeof result!=="undefined")
				{
					if (result > 0)
						resolve(true);	
					else
						resolve(false);
				}
				else
					reject(false);
			}).catch((err) =>{
				reject(err);
			});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Deletes a device from the datastore.
	 * @param {string} deviceId 
	 * @param {string} sessionId 
	 * @param {RedisClient} ds 
	 */
	static deleteFromDataStore(deviceId, sessionId, ds)
	{
		let key = "session:" + sessionId + ":device:" + deviceId;
		
		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");

			Device.getFromDataStore(deviceId, sessionId, ds).then((device)=>{
				return device.timelines.removeAll(true);
			}).then(()=>{
				logger.debug("deleting device key: " ,key);
				return ds.delAsync(key);
			}).then(()=>{
				resolve(true);
			}).catch((err) =>{
				reject(err);
			});
		});
	}

	// --------------------------------------------------------------------------

	static storageKey(deviceId, sessionId)
	{
		return "session:" + sessionId + ":device:" + deviceId;
	}

	static keyToId(key)
	{
		//return "session:" + sessionId + ":device:" + deviceId;
		if (typeof key !== "string")
			throw "invalid key";

		var array =  key.split(":");

		if (array.length !== 4)
			throw "invalid key";
		else
			return array[3];

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
	 * Get all the timelines for this device.
	 * @returns a promise that resolves into an array of timeline ids. 
	 */
	getTimelines()
	{
		var priv = PRIVATE.get(this);
		var self = this;

		return new Promise((resolve, reject) =>{

			self.timelines.getAll().then((timelineArray)=>{
				var promises = [];
				for (let t of timelineArray)
				{
					if (typeof t === "string"){
						var p = Timeline.deserialise(t, priv.ds);
						promises.push(p);
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
	 * Checks if this device contains this timeline
	 * @param {string | Timeline} id timeline identifier or Timeline object 
	 * @returns {Promise} a promise that resolves to a boolean value
	 */
	hasTimeline(id)
	{
		var timelineId =id;
		if (typeof id === "object" && id.id !=="undefined")
			timelineId = id.id;

		var timelineKey = Timeline.storageKey(timelineId, this.sessionId);

		return this.timelines.has(timelineKey);
	}

	
	// --------------------------------------------------------------------------
	/**
	 * Fetch a Timeline object for this identifier, if this timeline is registered
	 * in this device's list of timelines
	 * @param {string} timelineId a timeline identifier 
	 * @returns a Timeline object or null
	 */
	getTimeline(timelineId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		
		return new Promise((resolve, reject) =>{

			self.hasTimeline.call(self,timelineId).then((result)=>{
				if (result)
				{
					Timeline.getFromDataStore(timelineId, self.sessionId, priv.ds).then((timeline)=>{
						if (timeline)
						{
							if (timeline.providerId === self.id)
							{
								resolve(timeline);
							}
						}
						else 
							resolve(null);
					}).catch((result)=>{ reject(result); });
				}else
					resolve(null);
			});
		});
	}


	// --------------------------------------------------------------------------
	// Mutator Methods - changes this object's state
	// --------------------------------------------------------------------------

	/**
	 * Add a timeline to device list of timelines and save the timeline object to the datastore, if specified.
	 * @param {Timeline} timeline  a Timeline object 
	 * @param {boolean} overwrite overwrite an existing copy of this timeline if present. Default value is true.
	 */
	addTimeline(timeline, overwrite=true)
	{
		var self = this;

		if (typeof timeline.sessionId !== "undefined" && !(timeline instanceof Timeline))
			throw new Error("parameter should be a Timeline object");
		
		if (timeline.sessionId !== self.sessionId)
			throw new Error("sessionIds do not match");

		return self.timelines.insert(timeline, timeline.parentTLCorr.initialError, overwrite);
	}


	// --------------------------------------------------------------------------

	/**
	 * remove a timeline from this device's list of timelines and cleanup its persisted state
	 * @param {string} timelineId a timeline identifier
	 * @param {bool} erase erase timeline object from datastore after removing it from device's list of timelines
	 */
	removeTimeline(timelineId, erase=false)
	{
		var key = Timeline.storageKey(timelineId, this.sessionId);
		return this.timelines.del(key, erase);
	}


	removeAllTimelines(erase=false)
	{
		return this.timelines.removeAll(erase);
	}

	// --------------------------------------------------------------------------
	// Persistence methods
	// --------------------------------------------------------------------------

	/**
	 * Persist this object to a Redis datastore.
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	persist(ds)
	{
		var self = this;
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object");
		
		ds.hmset(this.serialise(), function(err, reply) {
			logger.debug("Device " , self.id, " saved : ", reply);
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

			ds.hmsetAsync(self.serialise())
				.then((reply)=>{
					if (typeof reply === "string")
					{
						reply = reply.trim();
						if (reply === "OK")
							resolve(true);
						else
							resolve(false);
					}else
						resolve(reply);					
				})
				.catch((error) =>{
					reject(error);
				});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Delete this timeline from the datastore
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	cleanUp(eraseTimelines=true)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		return new Promise((resolve, reject)=>{
			self.timelines.removeAll(eraseTimelines).then(()=>{
				return Device.deleteFromDataStore(self.id, self.sessionId, priv.ds);
			}).then((res)=>{
				resolve(res);
			}).catch((err)=>{reject(err);});
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
			Device.getFromDataStore(self.id, self.sessionId, priv.ds)
				.then((devicecopy)=>{
					if(devicecopy)
					{
						self.contextId = devicecopy.contextId;
						self.responseChannel = devicecopy.responseChannel;
						self.requestChannel = devicecopy.requestChannel;
						self.timelines = devicecopy.timelines; 						
						resolve(true);					
					}else
					{
						// device not found in datastore
						self.persist(priv.ds);
						resolve(false);
					}
					// devicecopy to be garbage-collected
				}).catch((err)=>{reject(err);});
		});
	}

	// --------------------------------------------------------------------------


	/**
	 * Deserialise Device object from Redis
	 * @param {String} key a key generated using the device id and sessionId properties. See storageKey()
	 * @param {RedisClient} datastore 
	 */
	static deserialise(key, datastore)
	{
		var t;

		return new Promise((resolve, reject) =>{
			datastore.hgetallAsync(key).then((obj)=>{
				
				if ((obj != null) && (typeof obj!=="undefined"))
				{
					t = new Device(obj.id, obj.sessionId, obj.contextId, obj.responseChannel, obj.requestChannel, datastore);
					resolve(t);	
				}
				else
					resolve(null);
			}).catch((err) =>{
				reject(err);
			});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Return a string representation of this object
	 */
	serialise()
	{
		return this.toArray();
	}

	// --------------------------------------------------------------------------
	/**
	 * Return a JSON representation of this object.
	 */
	toJSON()
	{
		var obj = {
			id: this.id,
			sessionId: this.sessionId,
			
			responseChannel: this.responseChannel,
			requestChannel: this.requestChannel,
			timelines: this.timelines.name
		};
		
		if (typeof this.contextId !== "undefined" &&  this.contextId !== null)
			obj.contextId = this.contextId;
		
		return JSON.stringify(obj);
	}

	// --------------------------------------------------------------------------
	toArray()
	{
		var priv = PRIVATE.get(this);
		var array = [];
		//index = 0; 

		array[0] = priv.key;
		array[1] = "id";
		array[2] = this.id;
		array[3] = "sessionId";
		array[4] = this.sessionId;
		array[5] = "responseChannel";
		array[6] = this.responseChannel;
		array[7] = "requestChannel";
		array[8] = this.requestChannel;
		array[9] = "timelines";
		array[10] = this.timelines.name;

		var index = 10;

		
		{
			array[++index] = "contextId";
			array[++index] = this.contextId;
		}

		return array;

	}
	// --------------------------------------------------------------------------

}

module.exports = Device;