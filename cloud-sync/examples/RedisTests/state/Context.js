/****************************************************************************
/* FILE:                context.js                            				*/
/* DESCRIPTION:         class for a synchronisation context                 */
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
const Device = require("./Device");
const PersistedArrayContainer = require("./PersistedArrayContainer");
var redis = require("redis");

var PRIVATE = new WeakMap();


/**
 * @class Context
 * 
 * @classdesc A logical grouping of devices into a sychronisation context.
 * A synchronisation session may consist of zero or more contexts.
 * 
 * @constructor
 * @param {string} contextId indentifier for this Context, this must be unique across the session e.g. "chrisZ_home"
 * @param {string} sessionId Identifier of the synchronisation session
 * @param {string} devices list of Device objects. 
 * @param {RedisClient} datastore a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
 * 
 */
class Context{

	// --------------------------------------------------------------------------
	// Lifecycle comparison methods
	// --------------------------------------------------------------------------
	
	constructor(contextId, sessionId, devices, datastore)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
	
		this.sessionId = sessionId;
		this.id = contextId;
		
		this.syncTimeline = undefined;
		this.syncControllerId = undefined;

		
		priv.key = "session:" + sessionId + ":context:" +contextId;

		if (typeof datastore =="undefined")
			throw new Error("No datastore argument");

		priv.ds = datastore;
		priv.devicesContainer = new PersistedArrayContainer(devices, Device, priv.ds, sessionId, Device.getFromDataStore);		

	}

	// --------------------------------------------------------------------------

	/**
	 * Checks a Device object for equality
	 * @param {Device} anotherObj 
	 */
	equals(anotherObj)
	{
		if (!(anotherObj instanceof Context))
		{
			console.log("anotherObj is not of type Context");
			return false;
		}
		
		let result = (	anotherObj.id === this.id &&
					anotherObj.sessionId === this.sessionId);

		if (!result) return false;

		if (this.devices.length !== anotherObj.devices.length)
			return false;

		this.devices.sort(Device.sortFunction);
		anotherObj.devices.sort(Device.sortFunction);

		for (let i = 0; i< this.devices.length - 1; i++)
		{
			if((this.devices[i] instanceof Device) && (anotherObj.devices[i] instanceof Device))
			{
				if (!(this.devices[i].equals(anotherObj.devices[i])))
					return false;
			}else if((typeof this.devices[i] === "string") && (typeof anotherObj.devices[i] === "string"))
			{
				if (this.devices[i]!==anotherObj.devices[i])
					return false;
			}
		}

		return true;
	}

	// --------------------------------------------------------------------------
	// Data store Context access methods
	// --------------------------------------------------------------------------
	/**
	 * Loads a Context object from the datastore for this context. 
	 * @param {string} contextId 
	 * @param {string} sessionId 
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a Context object 
	 */
	static getFromDataStore(contextId, sessionId, ds)
	{
		let key = "session:" + sessionId + ":context:" + contextId;
		
		return new Promise((resolve, reject) =>{
			
			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");
			
			ds.getAsync(key).then((result)=>{
		
				if (typeof result!=="undefined" && result !==null)
				{

					let obj = JSON.parse(result);
					// console.log("TEN");
					// console.log(obj.devices[0]);
					// lazy loading: devices is a list of ids
					let c = new Context(obj.id, obj.sessionId, obj.devices, ds);
					resolve(c);	
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
	 * Checks if a Context object with this deviceId exists in the datastore for this session.
	 * @param {string} contextId a context identifier
	 * @param {string} sessionId a session identifier
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 * @returns {Promise} a Promise object which returns a boolean value 
	 * on successful resolution
	 */
	static existsInDataStore(contextId, sessionId, ds)
	{

		let key = "session:" + sessionId + ":context:" + contextId;

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

	static deleteFromDataStore(contextId, sessionId, ds)
	{
		let key = "session:" + sessionId + ":context:" + contextId;
		
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

	/**
	 * Sort callback function to pass to sort() method of an array
	 * @param {Context} a 
	 * @param {Context} b 
	 */
	static sortFunction(a, b)
	{
		if ((a instanceof Context) && (b instanceof Context))
		{
			return new String(a.id).localeCompare(b.id);
		}else if ((a instanceof Context) && (typeof b === "string"))
		{
			return new String(a.id).localeCompare(b);
		}else if ((b instanceof Context) && (typeof a === "string"))
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
	 * Getter for devices property
	 * returns the devices list in this object local state as a list of deviceIds or Device objects
	 */
	get devices()
	{
		var priv = PRIVATE.get(this);
		return priv.devicesContainer.array;
	}

	// --------------------------------------------------------------------------

	set devices(devices)
	{
		var priv = PRIVATE.get(this);
		
		if (devices instanceof PersistedArrayContainer)
			priv.devicesContainer = devices;
		else if (Array.isArray(devices))
		{
			priv.devicesContainer = new PersistedArrayContainer(devices, Device, priv.ds, this.sessionId, Device.getFromDataStore);		
		}
	}

	// --------------------------------------------------------------------------
	/**
	 * Retrieves this Context's local list of devices as a list of Device objects
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	getMyDevices(ds)
	{
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object, RedisClient expected.");

		var promises = [];

		for (let d of this.devices)
		{
			if (typeof d === "string"){
				var p = Device.getFromDataStore(d, this.sessionId, ds);
				promises.push(p);
			}else if (d instanceof Device)
			{
				var q = new Promise((resolve)=>{
					resolve(d);
				});
				promises.push(q);
			}
		}
		return Promise.all(promises);
	}

	// --------------------------------------------------------------------------

	/**
	 * Retrieves this Context's list of devices from the data store.
	 * This includes devices added by other session controllers
	 * @param {RedisClient} ds a redis client object created using {@link https://www.npmjs.com/package/redis|redis} library 
	 */
	getMyDevicesFromDataStore(ds)
	{
		if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
			throw new Error("Invalid data store object, RedisClient expected.");
		
		var self = this;

		return new Promise((resolve, reject)=>{

			// first try to retrieve 
			Context.getFromDataStore(self.id, self.sessionId, ds).then((ctx_from_ds)=>{

				console.log("In getMyDevicesFromDataStore > " + ctx_from_ds.serialise());

				var tempArray = Array.from(ctx_from_ds.devices);
				// console.log(tempArray);
				
				
				resolve(tempArray);		
			}).catch((error)=>{ reject(error); });
		});
	}


	
	// --------------------------------------------------------------------------
	
	/**
	 * Fetch a Device object from this Context's state. The methods looks for the 
	 * device in this Context object's local state AND in this Context's persisted state.
	 * @param {string} deviceId 
	 * @returns {Promise} a promise object resolves to a Device object if object
	 * was found. Else if the device object is not found, the promise object resolves to null
	 */
	getDevice(deviceId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		return new Promise((resolve, reject) =>{

			// check if device exists in local state
			var findresult = self.findDeviceInLocalArray(deviceId);
				
			if ((findresult!==undefined) && (findresult instanceof Device))
			{
				resolve(findresult);
			}				
			else{
				Device.getFromDataStore(deviceId, self.sessionId, priv.ds).then((device)=>{
					if (device)
					{
						//console.log(">>> " , device.serialise());
						if (device.contextId === self.id)
						{
							// if device was in datastore but not in local Context object state
							// add it to the local devices list.
							// Only deviceId is added to Context.devices, as pushing a Device object
							// will result in the object being re-written into the datastore.
							// We want to avoid this, as it may trigger a cycle of writes and notifications
							if (findresult === undefined) 
								self.devices.push(device.id);
	
							resolve(device);
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
	 * Find index of device in Context object local array
	 * @param {string} deviceId 
	 * @returns {int} index of device if found, else -1 is returned
	 */
	IndexOfDeviceInLocalArray(deviceId) {
		var findresult = this.devices.findIndex(function (value) {
			if (value instanceof Device)
				return value.id === deviceId;
			else
				return value === deviceId;
		});
		return findresult;
	}

	// --------------------------------------------------------------------------

	/**
	 * Find device in Context object local array
	 * @param {string} deviceId 
	 * @returns {Device} a Device object if found, else `undefined` is returned
	 */
	findDeviceInLocalArray(deviceId) {

		var findresult = this.devices.find(function (value) {
			if (value instanceof Device)
			{
				return value.id === deviceId;
			}				
			else{
				return value === deviceId;
			}
				
		});
		return findresult;
	}

	// --------------------------------------------------------------------------
	// Mutator Methods - changes this Context object's state
	// --------------------------------------------------------------------------

	/**
	 * Add a device to this context object if it is not already present
	 * @param {string} deviceId 
	 * @param {string} responseChannel 
	 * @returns {Promise} a promise object resolves to a Device object
	 */
	addDeviceIfNotExists(deviceId, requestChannel, responseChannel)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		var device = null;
		return new Promise((resolve, reject) =>{

			self.reload().then(()=>{
				//console.log("IN Context.addDeviceIfNotExists(): context.devices.length ",  self.devices.length);
				// check if device exists in local state
				var device = self.findDeviceInLocalArray(deviceId);
				var index = self.IndexOfDeviceInLocalArray(deviceId);

				if (index !==-1)
				{
					//console.log("Context.addDeviceIfNotExists(): typeof device ",  typeof device);
					if (typeof device === "string")
					{
						//console.log("Context.addDeviceIfNotExists(): device exists ", device);
						return self.getDevice(device);

					}else if (device instanceof Device)
					{
						return Promise.resolve(device);
					}	
				}else
				{
					var d = new Device(deviceId, self.sessionId, self.id, responseChannel, [], priv.ds, requestChannel);
					//console.log("Context.addDeviceIfNotExists(): device not found ... adding new device ");
					self.devices.push(d);
					d.persist(priv.ds);

					return Promise.resolve(d);
				}

			}).then((device)=>{
				
				// console.log("Context.addDeviceIfNotExists(): after device lookup/creation");
				// console.log(device);
				if (device)
				{
					device.responseChannel = responseChannel;
					device.persist(priv.ds);
				}
				// console.log("Context.addDeviceIfNotExists(): before persist");
				// console.log(self.serialise());

				return self.persistAsync(priv.ds);
			}).then((result)=>{
				// console.log("Context.addDeviceIfNotExists() result: ", result);
				resolve(device);
			}).catch(error=>{reject(error);});	
		});
	}

	

	// --------------------------------------------------------------------------

	/**
	 * Removes device from context and deletes it from datastore
	 * @param {string} deviceId device identifier
	 */
	removeDevice(deviceId)
	{
		var priv = PRIVATE.get(this);
		var self = this;
		return new Promise((resolve, reject) =>{
			self.reload().then(()=>{

				// check if device exists in local state
				var index = self.IndexOfDeviceInLocalArray(deviceId);
				var device_to_delete = self.findDeviceInLocalArray(deviceId);

				if (index!== -1)
				{
					if (typeof device_to_delete === "string")
					{
						return self.getDevice(device_to_delete);

					}else if (device_to_delete instanceof Device)
					{
						return Promise.resolve(device_to_delete);
					}	
				}else
				{
					return Device.getFromDataStore(deviceId, self.sessionId, priv.ds);
				}
			}).then((device)=>
			{
				var index = self.IndexOfDeviceInLocalArray(deviceId);
				if(index !== -1 ) 
				{
					// console.log("delete from context array");
					self.devices.splice(index, 1);
				}

				if (device)
				{
					if (device.deviceId === self.deviceId)
					{
						device.cleanUp(priv.ds)
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
			for(let dev in this.devices)
			{
				if (dev instanceof Device)
					dev.persist(ds);
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
		return new Promise((resolve, reject) =>{

			if ((typeof ds === undefined) && (!(ds instanceof redis.RedisClient)))
				reject("Invalid data store object");
			
			var promises = [];

			for (let d of this.devices)
			{
				// console.log("TEST 2: mycontext persist 2 ");
				if (typeof d === "string")
				{
					var p = Device.existsInDataStore(d, this.sessionId, ds);
					promises.push(p);
				}else if (d instanceof Device)
				{
					// console.log("TEST 2: mycontext persist 3 ");
					var q = d.persistAsync(ds);
					promises.push(q);
				}
			}

			Promise.all(promises).catch((error)=>{
				reject(error);
			}).then((result)=>{
				if (result)
				{
					
					ds.setAsync(this.key, this.serialise()).then((result)=>{
						
						resolve(result);
						console.log("context '", this.id, "' saved.");
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
			//console.log("Context.cleanup(): cleaning context ", self.id);
			self.reload().then(()=>{
				return self.getMyDevices(ds);
			}).catch((error)=>{reject(error);
			}).then((devices)=>{

				if (devices.length > 0)
				{
					var promises = [];
					for (let d of devices)
					{
						if (d instanceof Device)
						{
							console.log("Context.cleanup(): cleaning device ", d.id);
							var q = d.cleanUp(ds);
							promises.push(q);
						}
					}
	
					return Promise.all(promises);
				}else
				{
					return Promise.resolve([true]);
				}				
			}).then((results)=>{
				//console.log("Context.cleanup(): cleaning context ", self.id);
				return Context.deleteFromDataStore(self.id, self.sessionId, ds);
			}).then((result)=>{
				//console.log("in cleanup ", result);
				// delete all devices array content
				self.devices.splice(0);
				resolve(true);
			}).catch((error)=>{reject(error);
			});
		});
	}

	// --------------------------------------------------------------------------

	reload()
	{
		var self = this;
		var priv = PRIVATE.get(this);

		return new Promise((resolve, reject)=>{

			Context.getFromDataStore(self.id, self.sessionId, priv.ds)
				.then((contextcopy)=>{
				
					if (contextcopy)
					{
						self.devices = contextcopy.devices;
						var promises = [];

						for (let i=0; i<self.devices.length;i++)
						{
							var p = self.devices[i];
							promises.push(p);
						}
						return Promise.all(promises);
					}else
					{
						self.persist(priv.ds);
						resolve(false);
					}

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
			syncTimeline: this.syncTimeline,
			syncControllerId : this.syncControllerId,
			devices: []
		};
		
		for (let d of this.devices)
		{
			if (typeof d === "string")
				obj.devices.push(d);
			else if (d instanceof Device)
				obj.devices.push(d.id);
		}
		
		return JSON.stringify(obj);
	}

	// --------------------------------------------------------------------------

	
}

module.exports = Context;