/****************************************************************************
/* FILE:                sourcetype.js                            			    */
/* DESCRIPTION:         class to store types of timeline  using the   */
/*						timeline source and type properties					            */
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
 * @class TimelineSourceType 
 * 
 * @classdesc A simple class to represent a device in a session's 
 * state.
 * 
 * @constructor
 * @param {string} sessionId the session this timeline type belongs to
 * @param {string} timelineSource the source of the timeline e.g. a video stream or a componentid
 * @param {string} timelineType a channel where the device listens to response messages
  * @param {List} timelines  a list  of timelines that have this source-type
 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 


 */
class TimelineSourceType
{
	// --------------------------------------------------------------------------
	// Lifecycle,  comparison methods
	// --------------------------------------------------------------------------

	constructor(sessionId, timelineSource, timelineType, ds)
	{

		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		priv.key = "session:" + sessionId + ":source:" + timelineSource + ":type:" + timelineType;
		console.log("key ", priv.key);

		if ((typeof sessionId ==="undefined") || (typeof timelineSource === "undefined") || (typeof timelineType === "undefined"))
			throw new Error("Invalid arguments");

		this.timelineSource 			= timelineSource;
		this.sessionId 					= sessionId;
		this.timelineType 				= timelineType;
		if (typeof ds === "undefined")
			throw new Error("No datastore argument");
		
		priv.ds = ds;
			
		var timelinesListKey = priv.key + ":timelines";

		this.timelines = list(timelinesListKey, priv.ds);
				
	}

	// --------------------------------------------------------------------------

	/**
	 * Checks a TimelineSourceType object for equality
	 * @param {TimelineSourceType} anotherObj 
	 */
	equals(anotherObj)
	{
		
		if (!(anotherObj instanceof TimelineSourceType))
		{
			logger.debug(anotherObj ," is not of type Device");
			return false;
		}
			
		return (anotherObj.key === this.key);
			
	}

	// --------------------------------------------------------------------------
	// Class-level methods
	// --------------------------------------------------------------------------


	/**
	 * Loads a TimelineSourceType object from the data store.
	 * @param {string} sessionId the session identifier
	 * @param {string} timelineSource the timeline's source identifier e.g. a contentid or serviceid
	 * @param {string} timelineType	the timelines's type identifier
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a TimelineSourceType object 
	 */
	static getFromDataStore(sessionId, timelineSource, timelineType, ds)
	{
		let key = TimelineSourceType.storageKey(sessionId, timelineSource, timelineType);
		if (!(ds instanceof redis.RedisClient))
			throw("data store object is not a RedisClient instance");

		return TimelineSourceType.deserialise(key, ds);
	}

	// --------------------------------------------------------------------------
	/**
	 * Checks if a TimelineSourceType exists in the Redis data store matching the input params.
 	 * @param {string} sessionId the session identifier
	 * @param {string} timelineSource the timeline's source identifier e.g. a contentid or serviceid
	 * @param {string} timelineType	the timelines's type identifier
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns a Promise object which resolves to a boolean value
	 */
	static existsInDataStore(sessionId, timelineSource, timelineType, ds)
	{

		let key = TimelineSourceType.storageKey(sessionId, timelineSource, timelineType);

		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");
			
			ds.hexistsAsync(key, "sessionId").then((result)=>{
				
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
	 * Deletes a TimelineSourceType from the datastore.
	 * @param {string} sessionId the session identifier
	 * @param {string} timelineSource the timeline's source identifier e.g. a contentid or serviceid
	 * @param {string} timelineType	the timelines's type identifier
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	static deleteFromDataStore(sessionId, timelineSource, timelineType, ds)
	{
		let key = TimelineSourceType.storageKey(sessionId, timelineSource, timelineType);
		
		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");


			TimelineSourceType.getFromDataStore(sessionId, timelineSource, timelineType, ds).then((sourcetype)=>{
				// remove timelines but do not erase them from the datastore
				return sourcetype.timelines.cleanUp(false);
			}).then(()=>{				
				return ds.delAsync(key);
			}).then(()=>{
				resolve(true);
			}).catch((err) =>{
				reject(err);
			});
		});
	}
	
	/**
	 * Deletes a TimelineSourceType from the datastore.
	 * @param {string} key TimelineSourceType storage key
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	static deleteFromDataStoreWithKey(key, ds)
	{
		
		return new Promise((resolve, reject) =>{
			if (!(ds instanceof redis.RedisClient))
				reject("data store object is not a RedisClient instance");


			TimelineSourceType.deserialise(key, ds).then((sourcetype)=>{
				// remove timelines but do not erase them from the datastore
				if (sourcetype) return sourcetype.timelines.cleanUp(false);
				else return true;
			}).then(()=>{				
				return ds.delAsync(key);
			}).then(()=>{
				resolve(true);
			}).catch((err) =>{
				reject(err);
			});
		});
	}

	// --------------------------------------------------------------------------


	static storageKey(sessionId, contentId, timelineType)
	{
		return "session:" + sessionId + ":source:" + contentId + ":type:" + timelineType;
	}

	// --------------------------------------------------------------------------

	// static keyToIds(key)
	// {
	// 	//return "session:" + sessionId + ":device:" + deviceId;
	// 	if (typeof key !== "string")
	// 		throw "invalid key";

	// 	var array =  key.split(":");

	// 	if (array.length !== 4)
	// 		throw "invalid key";
	// 	else
	// 		return {
	// 			sessionId: array[1],
	// 			timelineSource: array[3],
	// 			timelineType: array[5]
	// 		};

	// }


	// --------------------------------------------------------------------------
	// Accessor/mutator methods
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
	 * Get the number of timelines registered in this session.
	 * returns a Promise that resolves to an integer.
	 */
	getTimelinesCount()
	{
		return this.timelines.count();
	}

	/**
	 * Get the timelines available in this session. Return all the timelines in the range
	 * from minIdex to maxIndex. Use minIndex=0 and maxIndex=-1 to return all timelines.
	 * @param {Integer} minIndex start index
	 * @param {Integer} maxIndex end index
	 */
	getTimelines(minIndex, maxIndex)
	{
		
		var priv = PRIVATE.get(this);
		var self = this;


		if (typeof minIndex == "undefined") minIndex = 0;
		if (typeof maxIndex == "undefined") maxIndex = -1;

		return new Promise((resolve, reject) =>{

			self.timelines.getAllInRange(minIndex, maxIndex).then((timelineArray)=>{
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
	 * in this session's list of timelines
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
						if (timeline) resolve(timeline);
						else resolve(null);
					}).catch((result)=>{ reject(result); });
				}else
					resolve(null);
			});
		});
	}


	// --------------------------------------------------------------------------

	/**
	 * Add a timeline to TimelineSourceType list of timelines .
	 * @param {Timeline} timeline  a Timeline object 
	 */
	addTimeline(timeline)
	{
		var self = this;

		if (typeof timeline.sessionId !== "undefined" && !(timeline instanceof Timeline))
			throw new Error("parameter should be a Timeline object");
		
		if (timeline.sessionId !== self.sessionId)
			throw new Error("sessionIds do not match");

		return self.timelines.insert(timeline, timeline.parentTLCorr.initialError, false);
	}


	// --------------------------------------------------------------------------

	/**
	 * remove a timeline from this TimelineSourceType's list of timelines 
	 * @param {string} timelineId a timeline identifier
	 */
	removeTimeline(timelineId)
	{
		var key = Timeline.storageKey(timelineId, this.sessionId);
		console.log("TimelineSourceType:removeTimeline() timeline ", timelineId );
		return this.timelines.del(key, false);
	}

	/**
	 *  remove all timelines from this TimelineSourceType's list of timelines 
	 */
	removeAllTimelines()
	{
		return this.timelines.removeAll(false);
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
			logger.debug("TimelineSourceType " , self.key, " saved : ", reply);
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
	cleanUp()
	{
		var priv = PRIVATE.get(this);
		var self = this;
		
		return TimelineSourceType.deleteFromDataStore(self.sessionId, self.timelineSource, self.timelineType, priv.ds);
		
		
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
					t = new TimelineSourceType(obj.sessionId, obj.timelineSource, obj.timelineType, datastore);
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
	toArray()
	{
		var priv = PRIVATE.get(this);
		var array = [];
		//index = 0; 

		array[0] = priv.key;
		array[1] = "sessionId";
		array[2] = this.sessionId;
		array[3] = "timelineSource";
		array[4] = this.timelineSource;
		array[5] = "timelineType";
		array[6] = this.timelineType;
		array[7] = "timelines";
		array[8] = this.timelines.name;

		return array;

	}
	// --------------------------------------------------------------------------

}

module.exports = TimelineSourceType;