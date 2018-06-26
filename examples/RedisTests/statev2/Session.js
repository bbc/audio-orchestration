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
const TimelineSourceType = require("./TimelineSourceType");
const Device = require("./Device");
const list = require("./SafeList");
const SyncTLElection = require("./SyncTLElection");
var redis = require("redis");
var Logger = require("../logger/logger");

var PRIVATE = new WeakMap();
var logger = Logger.getNewInstance();

/**
 * @class Session
 * 
 * @classdesc A synchronisation session state representation
 * 
 * @constructor
 * @param {string} sessionId Identifier of the synchronisation session
 */ 
class Session
{
	// --------------------------------------------------------------------------
	// Lifecycle,  comparison methods
	// --------------------------------------------------------------------------

	constructor(sessionId, description, synctlstrategy, datastore, persist=false)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
		
		this.id =  sessionId;
		this.description = description || "default" ;
		this.synctlStrategy = synctlstrategy || SyncTLElection.EARLIEST_FIRST;

		if (typeof datastore =="undefined")
			throw new Error("No datastore argument");		
		priv.ds = datastore;

		priv.key = "session:" + sessionId;


		// list of devices
		var deviceListKey = priv.key + ":devices";
		this.devices = list(deviceListKey, priv.ds);

		// list of timelines
		var timelinesListKey = priv.key + ":timelines";
		this.timelines = list(timelinesListKey, priv.ds);

		// timeline source types list
		var sourceTypesListKey= priv.key + ":sourcetypes";
		this.sourceTypes = list(sourceTypesListKey, priv.ds);

		// list of synchronisation timelines
		var syncTimelinesListKey= priv.key + ":synctimelines";
		this.synctimelines = list(syncTimelinesListKey, priv.ds);

		this.channel = "Sessions/" + sessionId + "/state";

		// save session to datastore after creation
		if (persist) this.persist(priv.ds);

	}

	// --------------------------------------------------------------------------

	equals(session)
	{
		if ((typeof session.id === "undefined") || !(session instanceof Session) )
			return false;
		
		return (this.id === session.id);
	}

	// --------------------------------------------------------------------------
	// Data store access methods
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

		if (!(ds instanceof redis.RedisClient))
			throw("data store object is not a RedisClient instance");

		return Session.deserialise(key, ds);
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
			}).catch((datastore_reply) =>{
				reject(datastore_reply);
			});
		});

	}


	// --------------------------------------------------------------------------

	/** */
	static deleteFromDataStore(sessionId, ds)
	{
		if (!(ds instanceof redis.RedisClient))
			throw new Error("data store object is not a RedisClient instance");

		
		return new Promise((resolve, reject) =>{
			
			Session.getFromDataStore(sessionId, ds).then((session)=>{				
				if (!session){
					resolve(true);
					return;
				}
				// remove all devices
				return session.cleanUp(ds);
			}).then(()=>{
				resolve(true);	
			}).catch((err) =>{reject(err);});
		});		
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

	/**
	 * Return storage key for this session
	 * @param {string} sessionId 
	 */
	static storageKey(sessionId)
	{
		return "session:" + sessionId;
	}

	// --------------------------------------------------------------------------

	/**
	 * Convert storage key for session to session's id.
	 * @param {string} key 
	 */
	static keyToId(key)
	{
		if (typeof key !== "string")
			throw "invalid key";

		var array =  key.split(":");

		if (array.length !== 2)
			throw "invalid key";
		else
			return array[1];
	}


	


	// --------------------------------------------------------------------------
	// Device management methods
	// --------------------------------------------------------------------------


	/**
	 * Get devices in this session.  Return all the timelines in the range
	 * from minIdex to maxIndex. Use minIndex=0 and maxIndex=-1 to return all timelines.
	 * @param {Integer} minIndex start index
	 * @param {Integer} maxIndex end index
	 * @returns a Promise object that resolves into an array of available devices
	 */
	getDevices(minIndex, maxIndex)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		if (typeof minIndex == "undefined") minIndex = 0;
		if (typeof maxIndex == "undefined") maxIndex = -1;

		return new Promise((resolve, reject) =>{

			self.devices.getAllInRange(minIndex, maxIndex).then((deviceArray)=>{
				var promises = [];
				for (let deviceKey of deviceArray)
				{
					if (typeof deviceKey === "string"){
						var p = Device.deserialise(deviceKey, priv.ds);
						promises.push(p);
					}
				}
				return Promise.all(promises);
			}).then((devices)=>{
				resolve(devices);
			}).catch((result)=>{reject(result);});
		});
	}


	// --------------------------------------------------------------------------


	hasDevice(id)
	{
		var deviceId =id;
		if (typeof id === "object" && id.id !=="undefined")
			deviceId = id.id;

		var deviceKey = Device.storageKey(deviceId, this.id);

		return this.devices.has(deviceKey);
	}



	// --------------------------------------------------------------------------

	/**
	 * Get a Device object if this device is registered in this session
	 * @param {string} deviceId 
	 */
	getDevice(deviceId)
	{

		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			self.hasDevice.call(self, deviceId).then((found)=>{

				// console.log("Session.getDevice() found device ", deviceId , found);
				if(found)
				{
					Device.getFromDataStore(deviceId, self.id, priv.ds).then((device)=>{
						resolve(device);
					}).catch((result)=>{ reject(result); });
				}else
				{
					resolve(null);
				}

			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * 
	 * 
	 * @param {Device} device 
	 */
	addDevice(device, overwrite=true)
	{
		var self = this;

		if (!(device instanceof Device))
			throw new Error("parameter should be a Device object");

		if (device.sessionId !== self.id)
			throw new Error("sessionIds do not match");

		return new Promise((resolve, reject) =>{
			device.getTimelines().then((timelines)=>{
				
				var promises = [];
				for (const t of timelines) {
					if (t!==null){
						var p = self.addTimeline(t);
						promises.push(p);
					}					
				}
				return Promise.all(promises);
			}).then(()=>{
				// console.log("adding device ..");
				// console.log(device);
				return self.devices.insert(device, null, overwrite);
			}).then((result)=>{resolve(result);})
				.catch((result)=>{reject(result);});
		});
		
	}



	// --------------------------------------------------------------------------

	/**
	 * Remove device and its timelines from this session
	 * @param {String} deviceId device identifier
	 */
	removeDevice(deviceId)
	{
		var self = this;
		var priv = PRIVATE.get(this);
		// console.log("Session Remove device ",  deviceId);

		return new Promise((resolve, reject) =>{
			self.getDevice.call(self, deviceId).then((device)=>{

				if (device!=null)
				{
					return device.getTimelines();
				}else
					return Promise.resolve();
			}).then((timelines)=>{

				// console.log("Session.removeDevice(): timelines", timelines);
				// for each timeline that the device has, remove the timelines from the session's other lists
				if((typeof timelines !== "undefined") && Array.isArray(timelines))
				{
					var promises =[];
					timelines.forEach(timeline=>{

						promises.push(self.getTimelineSourceType(timeline.contentId, timeline.timelineType).then((sourceType)=>{
							// console.log("Session.removeDevice(): getTimelineSourceType ",  sourceType);
							if (sourceType!==null) return sourceType.removeTimeline(timeline.id);
							else return Promise.resolve((false));
						}));
						var key = Timeline.storageKey(timeline.id, self.id);

						promises.push(self.timelines.del(key, true));
					});

					return Promise.all(promises);
					
				}else
				{
					return Promise.resolve();
				}
			
			}).then(()=>{
				return Device.deleteFromDataStore(deviceId, self.id, priv.ds);
			}).then(()=>{
				return self.devices.del(Device.storageKey(deviceId, self.id));
			}).then(()=>{
				resolve(true);
			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Remove device and its timelines from this session
	 * @param {Device} device 
	 */
	_removeDevice(device)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{
			device.getTimelines().then((timelines)=>{
				// for each timeline that the device has, remove the timelines from the session's other lists
				if((typeof timelines !== "undefined") && Array.isArray(timelines))
				{
					// console.log("Session._removeDevice(): ", timelines);
					var promises =[];
					timelines.forEach(timeline=>{
						if (timeline!==null){
							promises.push(self.getTimelineSourceType(timeline.contentId, timeline.timelineType).then((sourceType)=>{
								// console.log("Session.removeDevice(): getTimelineSourceType ",  sourceType);
								if (sourceType!==null) return sourceType.removeTimeline(timeline.id);
								else return Promise.resolve((false));
							}));
							var key = Timeline.storageKey(timeline.id, self.id);

							promises.push(self.timelines.del(key, true));
						}
					});
					return Promise.all(promises);
				}else
				{
					return Promise.resolve();
				}
			}).then(()=>{
				return Device.deleteFromDataStore(device.id, self.id, priv.ds);
			}).then(()=>{
				return self.devices.del(Device.storageKey(device.id, self.id));
			}).then(()=>{
				resolve(true);
			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Remove all devices and their timelines from this session. They are all erased from the datastore.
	 */
	removeAllDevices()
	{

		var self = this;
		

		return new Promise((resolve, reject) =>{

			self.getDevices().then((devices)=>{

				var promises = [];
				devices.forEach((device)=>{
					promises.push(self._removeDevice(device));
				});

				return Promise.all(promises);
			}).then(()=>{
				resolve();
			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------
	// Timeline management methods
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

		if (typeof minIndex === "undefined") minIndex = 0;
		if (typeof maxIndex === "undefined") maxIndex = -1;

		return new Promise((resolve, reject) =>{

			self.timelines.getAllInRange(minIndex, maxIndex).then((timelineArray)=>{
				// console.log("Session.getTimelines(minIndex, maxIndex): timelineArray: ", timelineArray );
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

		var timelineKey = Timeline.storageKey(timelineId, this.id);

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
				// console.log("Session.getTimeline() - self.hasTimeline(): result", result);
				if (result)
				{
					Timeline.getFromDataStore(timelineId, self.id, priv.ds).then((timeline)=>{
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
	 * Add a timeline to session's list of timelines and save the timeline object to the datastore, if specified.
	 * The Device and TimelineSourceType object associated with this timeiline are also updated.
	 * @param {Timeline} timeline  a Timeline object 
	 * @param {boolean} overwrite overwrite an existing copy of this timeline if present. Default value is true.
	 */
	addTimeline(timeline, overwrite=true)
	{
		var self = this;

		if (typeof timeline.sessionId !== "undefined" && !(timeline instanceof Timeline))
			throw new Error("parameter should be a Timeline object");
		
		if (timeline.sessionId !== self.id)
			throw new Error("sessionIds do not match");
		
		return new Promise((resolve, reject) =>{

			self.getDevice(timeline.providerId).catch((error)=>{ 
				reject(error);
			}).then((device)=>{
				if((device!==null) && (device instanceof Device))
				{	
					return device.addTimeline(timeline, overwrite);
				}else
				{
					return Promise.reject("Timeline provider not found");
				}
			}).catch((error) =>{
				reject(error);
			}).then((result)=>{
				// console.log("Session.addTimeline() - add timeline to device: ", result);
				return self.timelines.insert(timeline, timeline.parentTLCorr.initialError, overwrite);
			}).then((result)=>{
				// console.log("Session.addTimeline() - add timeline in session timelines list: ", result);
				return self.getTimelineSourceType(timeline.contentId, timeline.timelineType);
			}).then((sourceType)=>{
				// console.log("Session.addTimeline() - sourcetype lookup returned: ");
				// console.log(sourceType);
				
				if (sourceType === null){
					// console.log("Session.addTimeline() - create sourcetype: %s %s", timeline.contentId, timeline.timelineType);
					return self.addTimelineSourceType(timeline.contentId,timeline.timelineType);
				} 
				else
					return sourceType;
				
			}).then((sourceType)=>{
				// console.log("Session.addTimeline() -self.addTimelineSourceType returned: ");
				// console.log(sourceType);
				if  ((typeof sourceType === "object" ) && (sourceType instanceof TimelineSourceType))
				{
					// console.log("Session.addTimeline() - add timeline to sourcetype: ", sourceType.serialise());
					return sourceType.addTimeline(timeline);
				}else{

					return self.getTimelineSourceType(timeline.contentId, timeline.timelineType);
					// return self.getTimelineSourceTypes();
				}
				
			}).then((sourceType)=>{
				

				if  ((typeof sourceType === "object" ) && (sourceType instanceof TimelineSourceType))
				{
					// console.log("Session.addTimeline() - add timelime to sourcetype: ", sourceType.serialise());
					// console.log("Session.addTimeline() - add timelime to sourcetype: ", result);
					return sourceType.addTimeline(timeline);
				}else{
					// console.log("Session.addTimeline() - 1 added timelime to sourcetype: ", sourceType);
					resolve(true);
				}
			}).then((result)=>{
				// console.log("Session.addTimeline() - 2 added timelime to sourcetype: ", result);
				resolve(true);
			}).catch((error) =>{
				reject(error);
			});	
		});		
	}
	

	
	// --------------------------------------------------------------------------

	/**
	 * Unregister a timeline from this session
	 * @param {string} timelineId timeline identifier
	 * @param {string} deviceId device identifier
	 */
	removeTimeline(timelineId)
	{
		var self = this;
		var timelineToDel=null;
		logger.debug("Remove timeline ", timelineId, " from session ", self.id);
		return new Promise((resolve, reject) =>{
			// retrieve timeline from session
			logger.debug("retrieve timeline from session ", self.id);		
			self.getTimeline(timelineId)
				.catch((error)=>{ reject(error);})
				.then((timeline)=>{
							
					if(timeline)
					{
						timelineToDel = timeline;
						logger.debug("get timeline provider device object" , timeline.providerId, " from session: ", self.id);
						return self.getDevice(timeline.providerId);
					}else{
						logger.debug("timeline not found in session ", self.id);
						resolve(false);
					}						
				})
				.then((device)=>{
					// remove timeline from its provider
					if ((typeof device !== "undefined") && (device !== null))
					{
						logger.debug("Device ", device.id, " found, removing timeline from device");
						return device.removeTimeline(timelineId, true);
					}else{
						logger.debug("Timeline provider not found");
						return  timelineToDel;
					}
						
				})
				.then(()=>{
					// get timeline source-type object from session
					if ((timelineToDel) && (timelineToDel instanceof Timeline)){
						logger.debug("get timeline source type object from session: ", self.id);
						return self.getTimelineSourceType(timelineToDel.contentId, timelineToDel.timelineType);
					}						
					else
						return null;

				})
				.then((sourceType)=>{
					// remove timeline from sourcetype object
					if ((sourceType!==null) && (sourceType instanceof TimelineSourceType)){
						logger.debug("sourceType ", sourceType.key, " found, removing timeline from sourceType");
						return sourceType.removeTimeline(timelineId);
					}						
					else
						return null;

				}).then(()=>{
					// delete timeline from session's list of timelines
					logger.debug("Deleting timeline from session's timelines...");
					var key = Timeline.storageKey(timelineId, self.id);
					return this.timelines.del(key, true);
				}).then(()=>{
					logger.debug("Timeline ", timelineId, " deleted.");
					resolve(true);
				}).catch((error)=>{ reject(error);});
		});

	}


	/**
	 * Remove all timelines. They are all erased from the datastore.
	 * Be careful when using this method. It does not remove the timelines
	 */
	removeAllTimelines()
	{
		var self = this;
		return self.timelines.removeAll(true);
	}

	// --------------------------------------------------------------------------
	// TimelineSourceType management methods
	// --------------------------------------------------------------------------


	/**
	 * Get TimelineSourceTypes in this session. Return all the timelines in the range
	 * from minIdex to maxIndex. Use minIndex=0 and maxIndex=-1 to return all timelines.
	 * @param {Integer} minIndex start index
	 * @param {Integer} maxIndex end index
	 * @returns a Promise object that resolves into an array of keys (string) one for each available TimelineSourceType
	 */
	getTimelineSourceTypes(minIndex, maxIndex)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		if (typeof minIndex == "undefined") minIndex = 0;
		if (typeof maxIndex == "undefined") maxIndex = -1;

		return new Promise((resolve, reject) =>{

			self.sourceTypes.getAllInRange(minIndex, maxIndex).then((array)=>{
				var promises = [];
				// console.log("all sourcetype keys", array);
				for (let key of array)
				{
					if (typeof key === "string"){
						var p = TimelineSourceType.deserialise(key, priv.ds);
						promises.push(p);
					}
				}
				return Promise.all(promises);
			}).then((stypes)=>{
				resolve(stypes);
			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Checks if a timeline-source-type exists in this session.
	 * @param {string} source timeline source e.g. a contentId or component identifier
	 * @param {string} type timeline type
	 * @returns a Promise object that resolves to a boolean value
	 */
	hasTimelineSourceType(source, type)
	{
		if ((typeof source === "undefined") && (typeof type === "undefined"))
			throw new Error("Missing paramaters");
		
		if ((typeof source !== "string") && (typeof type !== "string"))
			throw new Error("Invalid parameter types. String parameters expected.");	

		var sourceTypeKey = TimelineSourceType.storageKey(this.id, source, type);

		return this.sourceTypes.has(sourceTypeKey);
	}



	// --------------------------------------------------------------------------

	/**
	 * Get a TimelineSourceType object if this timeline source-type is registered in this session
	 * @param {string} source timeline source e.g. a contentId or component identifier
	 * @param {string} type timeline type
	 * @returns a Promise object that resolves to a TimelineSourceType object or null
	 */
	getTimelineSourceType(source, type)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			self.hasTimelineSourceType.call(self, source, type).then((found)=>{
				// console.log("Session.getTimelineSourceType() - found? ", found);
				if(found)
				{
					TimelineSourceType.getFromDataStore(self.id, source, type, priv.ds).then((sourcetype)=>{
						resolve(sourcetype);
					}).catch((err)=>{ reject(err); });
				}else
				{
					resolve(null);
				}
			}).catch((err)=>{ reject(err); });
		});

	}

	// --------------------------------------------------------------------------

	/**
	 *  Create and add TimelineSourceType object to this sesison
	 * @param {string} source timeline source e.g. a contentId or component identifier
	 * @param {string} type timeline type
	 */
	addTimelineSourceType(source, type)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		if ((typeof source === "undefined") && (typeof type === "undefined"))
			throw new Error("Missing paramaters");
	
		if ((typeof source !== "string") && (typeof type !== "string"))
			throw new Error("Invalid parameter types. String parameters expected.");	


		var sourceType = new TimelineSourceType(self.id, source, type, priv.ds);

		return self.sourceTypes.insert(sourceType, null, true);
		
	}

	// --------------------------------------------------------------------------

	removeTimelineSourceType(source, type)
	{
		var self = this;
		var priv = PRIVATE.get(this);
		if ((typeof source === "undefined") && (typeof type === "undefined"))
			throw new Error("Missing paramaters");
	
		if ((typeof source !== "string") && (typeof type !== "string"))
			throw new Error("Invalid parameter types. String parameters expected.");	

		return new Promise((resolve, reject) =>{
			self.hasTimelineSourceType.call(self, source, type).then((found)=>{
				if(found)
				{
					return TimelineSourceType.deleteFromDataStore(self.id, source, type, priv.ds);
				}else
				{
					return Promise.resolve();
				}
			}).then(()=>{
				return self.sourceTypes.del(TimelineSourceType.storageKey(self.id, source, type));
			}).then(()=>{
				resolve(true);
			}).catch((result)=>{reject(result);});
		});
	}

	// --------------------------------------------------------------------------

	/**
	 * Remove all TimelineSourceType. They are all erased from the datastore.
	 */
	removeAllTimelineSourceTypes()
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject) =>{

			self.sourceTypes.getAll().then((keysArray)=>{

				// console.log(keysArray);

				var promises = [];
				for (let k of keysArray)
				{
					
					if (typeof k === "string"){
						
						var p = TimelineSourceType.deleteFromDataStoreWithKey(k, priv.ds);
						promises.push(p);
					}
				}
				return Promise.all(promises);
			}).then(()=>{
				return self.sourceTypes.removeAll(true);
			}).then(()=>{
				resolve();
			}).catch((result)=>{reject(result);});
		});
		
	}


	// --------------------------------------------------------------------------
	// Sync Timeline management methods
	// --------------------------------------------------------------------------

	/**
	 * Get the number of sync-timelines registered in this session.
	 * returns a Promise that resolves to an integer.
	 */
	getSyncTimelinesCount()
	{
		return this.synctimelines.count();
	}

	/**
	 * Get synchronisation timelines in this session. Return all the timelines in the range
	 * from minIdex to maxIndex. Use minIndex=0 and maxIndex=-1 to return all timelines.
	 * @param {Integer} minIndex start index
	 * @param {Integer} maxIndex end index
	 * @returns a Promise object that resolves into an array of available sync-timelines
	 */
	getSyncTimelines(minIndex, maxIndex)
	{
		var self = this;
		var priv = PRIVATE.get(this);

		if (typeof minIndex === "undefined") minIndex = 0;
		if (typeof maxIndex === "undefined") maxIndex = -1;

		return new Promise((resolve, reject) =>{

			self.synctimelines.getAllInRange(minIndex, maxIndex).then((timelineArray)=>{
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
	 * Checks if this session contains this sync timeline
	 * @param {string | Timeline} id timeline identifier or Timeline object 
	 * @returns {Promise} a promise that resolves to a boolean value
	 */
	hasSyncTimeline(id)
	{
		var timelineId =id;
		if (typeof id === "object" && id.id !=="undefined")
			timelineId = id.id;

		var timelineKey = Timeline.storageKey(timelineId, this.id);

		return this.synctimelines.has(timelineKey);
	}

	// --------------------------------------------------------------------------

	/**
	 * Checks if this session contains a sync timeline for this source-type
	 * @param {string} source timeline source e.g. a contentId
	 * @param {string} type timeline type
	 * @returns {Promise} a promise that resolves to a boolean value
	 */
	hasSyncTimelineForSourceType(source, type)
	{
		var self = this;
		if ((typeof source === "undefined") || (source === null))
			throw new Error("Invalid source parameter ");
		if ((typeof type === "undefined") || (type === null))
			throw new Error("Invalid type parameter ");

		return new Promise((resolve, reject) =>{

			self.getSyncTimelines().then((timelines)=>{

				var timeline_found = null;
				for (const t of timelines) {

					if ((t.contentId === source) && (t.timelineType === type))
					{
						timeline_found = t;
						break;
					}
				}
				resolve(timeline_found !==null);
			}).catch((result)=>{ reject(result); });

		});

	}

	// --------------------------------------------------------------------------

	/**
	 * Checks if this session contains a sync timeline for this source-type
	 * @param {string} source timeline source e.g. a contentId
	 * @param {string} type timeline type
	 * @returns {Promise} a promise that resolves to a boolean value
	 */
	getSyncTimelineForSourceType(source, type)
	{
		var self = this;
		if ((typeof source === "undefined") || (source === null))
			throw new Error("Invalid source parameter ");
		if ((typeof type === "undefined") || (type === null))
			throw new Error("Invalid type parameter ");

		return new Promise((resolve, reject) =>{

			self.getSyncTimelines().then((timelines)=>{

				var timeline_found = null;
				for (const t of timelines) {

					if ((t.contentId === source) && (t.timelineType === type))
					{
						timeline_found = t;
						break;
					}
				}
				resolve(timeline_found);
			}).catch((result)=>{ reject(result); });

		});
	}




	// --------------------------------------------------------------------------

	/**
	 * Fetch a Sync Timeline object for this identifier, if this timeline is registered
	 * in this session's list of sync timelines
	 * @param {string} timelineId a timeline identifier 
	 * @returns a Timeline object or null
	 */
	getSyncTimeline(timelineId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		
		return new Promise((resolve, reject) =>{
			self.hasSyncTimeline.call(self, timelineId).then((result)=>{
				if (result)
				{
					Timeline.getFromDataStore(timelineId, self.id, priv.ds).then((timeline)=>{
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
	 *  Add a sync timeline to this sesison
	 * @param {Timeline} timeline a timeline object
	 * @param {boolean} overwrite overwrite an existing copy of this timeline if present. Default value is true.

	 */
	addSyncTimeline(timeline, overwrite=true)
	{
		var self = this;
		// console.log(timeline);

		if (typeof timeline.sessionId !== "undefined" && !(timeline instanceof Timeline))
			throw new Error("parameter should be a Timeline object");
	
		if (timeline.sessionId !== self.id)
			throw new Error("sessionIds do not match");	


		return self.synctimelines.insert(timeline, timeline.parentTLCorr.initialError, overwrite);		
	}

	// --------------------------------------------------------------------------

	removeSyncTimeline(timelineId)
	{
		var self = this;

		if ((typeof timelineId !== "string"))
			throw new Error("Invalid paramaters");

		logger.debug("Deleting sync timeline ", timelineId , " from session ", self.id);

		var key = Timeline.storageKey(timelineId, self.id);
			
		return self.synctimelines.del(key, true);	
	}

	// --------------------------------------------------------------------------

	/**
	 * Remove all sync timelines. They are all erased from the datastore.
	 */
	removeAllSyncTimelines()
	{
		var self = this;
		return self.synctimelines.removeAll(true);
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
		var self = this;
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object");
		
		// console.log("Persist");	
		// console.log(this);
		// console.log(this.serialise());

		ds.hmset(this.serialise(), function(err, reply) {
			logger.debug("Session " , self.id, " saved : ", reply);
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
	 * Deserialise Device object from Redis
	 * @param {String} key a key generated using the device id and sessionId properties. See storageKey()
	 * @param {RedisClient} datastore 
	 */
	static deserialise(key, datastore)
	{
		var s;

		return new Promise((resolve, reject) =>{
			datastore.hgetallAsync(key).then((obj)=>{
								
				if ((obj != null) && (typeof obj!=="undefined"))
				{
					s = new Session(obj.id, obj.description, parseInt(obj.synctlStrategy), datastore);
					resolve(s);	
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
		array[0] = priv.key;
		array[1] = "id";
		array[2] = this.id;
		array[3] = "description";
		array[4] = this.description;
		array[5] = "devices";
		array[6] = this.devices.name;
		array[7] = "timelines";
		array[8] = this.timelines.name;
		array[9] = "sourceTypes";
		array[10] = this.sourceTypes.name;
		array[11] = "synctimelines";
		array[12] = this.synctimelines.name;
		array[13] = "channel";
		array[14] = this.channel;
		array[15] = "synctlStrategy";
		array[16] = this.synctlStrategy;

		return array;

	}

	// --------------------------------------------------------------------------

	/**
	 * Remove persisted session from datastore and allow this session object to be garbage-collected.	 */
	cleanUp()
	{
		var self =this;
		var priv = PRIVATE.get(this);
		return new Promise((resolve, reject)=>{

			// remove registered devices
			self.removeAllSyncTimelines()
				.then(()=>{
					return self.removeAllTimelineSourceTypes();
				})
				.then(()=>{
					return self.removeAllTimelines();
				})
				.then(()=>{
					return self.removeAllDevices();
				})
				.then(()=>{
					priv.ds.del(priv.key);
					resolve(true);
				})
				.catch((error)=>{reject(error);});			
		});

	}

	// --------------------------------------------------------------------------


	
}

module.exports = Session;