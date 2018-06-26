/**
 * Module dependencies.
 * @api private
 */
var redis = require("redis");
var client = redis.createClient;
var bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

var PRIVATE = new WeakMap();

/**
 * Expose 'list'
 */

module.exports = List;


/**
 * List contructor.
 *
 * Initialize a list in redis with
 * the given name.
 *
 * Examples:
 *
 *   list = require('list')('mylist');
 *
 * @param {String} name
 * @api public
 */

function List(name, ds) {
	PRIVATE.set(this,{});
	var priv = PRIVATE.get(this);

	if(!(this instanceof List)) return new List(name, ds);
	// will need to pass options to set client

	if ( typeof ds !== "undefined" && ds !== null ) 
	{
		this.client = ds;
	}else
		throw "invalid data store";
	this.name = name;
	priv.countKey = name+":count";


	this.client.setnx(priv.countKey, -1);
}

/**
 * Increment count
 * 
 * @return {Promise}
 * @api private
 */

List.prototype.lastIndex = function() {
	var priv = PRIVATE.get(this);
	var self = this;

	return new Promise((resolve, reject) =>{
		
		self.client.getAsync(priv.countKey).then((index)=>{
			resolve(index);
		}).catch((err)=>{
			reject(err);
		});
	});
};



List.prototype.indexOf = function(key) {

	var self = this;

	return new Promise((resolve, reject) =>{
		self.client.zrankAsync(this.name, key).then((result)=>{
			resolve(result);
		}).catch((err)=>{
			reject(err);
		});
	});
};

/**
 * Increment count
 * 
 * @return {Promise}
 * @api private
 */

List.prototype.incr = function() {
	var priv = PRIVATE.get(this);
	var self = this;

	return new Promise((resolve, reject) =>{
		
		self.client.incrAsync(priv.countKey).then((index)=>{
			resolve(index);
		}).catch((err)=>{
			reject(err);
		});
	});
};


List.prototype.decr = function() {
	var priv = PRIVATE.get(this);
	var self = this;

	return new Promise((resolve, reject) =>{
		
		self.client.decrAsync(priv.countKey).then((index)=>{
			resolve(index);
		}).catch((err)=>{
			reject(err);
		});
	});
};
  
/**
 * Flatten object.
 *   
 * @param  {Object} obj 
 * @return {Array}
 * @api private
 */

function flatten(id, obj) {
	var arr = [id];
	for(var key in obj) {
		arr.push(key, obj[key]);
	}
	return arr;
}


/**
 * Is type of.
 * 
 * @param  {Any}  data 
 * @param  {String}  type 
 * @return {Boolean}
 * @api private
 */

function is(data, type) {
	//NOTE: may be use library
	return (typeof data === type);
}


/**
 * Hash options into hash keys
 * 
 * Hashes are identified with the 
 * list name suffixed by ':' and 
 * the id.
 * 
 * @param  {String | Integer} id
 * @param  {Object} data 
 * @api private
 */

List.prototype.hmset = function(id, data) {
	
	// console.log("in List.prototype.hmset");
	if(is(data,"object")) {
		var flattened, result;
		
	
		if (typeof data.serialise === "function")
			result = data.serialise();
			
		if (Array.isArray(result))
			flattened = result;
		else
			flattened = flatten(id, data);
			
			
		return this.client.hmsetAsync(flattened);
	}

};


/**
 * Add set in list.
 * 
 * @param {string}   key 
 * @param {Function} cb
 * @api private
 */

List.prototype.add = function(key, sortScore) {	
	var self = this;

	return new Promise((resolve, reject) =>{

		self.indexOf(key).then((result)=>{

			// console.log("result index:", result);

			if (result)
				return result;
			else
				return self.incr();
		}).then((index)=>{
			// console.log("add(): index ", index);
			if ( typeof(sortScore) !== "undefined" && sortScore !== null )
				index = sortScore;
			self.client.zaddAsync(this.name, index, key).then((res)=>{
				// console.log("add() zadd result", res);
				resolve(res);
			}).catch((err)=>{
				reject(err);
			});
		});		
	});
};


/**
 * insert item into the list based on score
 * item should have a key property with a unique value.
 *
 * Examples:
 *
 *  list.insert(cb, 1);
 *  
 *  list.push({
 *    name: 'bredele'
 *  }, cb);
 * 
 * @param {Object | Function} data
 * @param {Function} cb
 * @param {number} sortScore Optional score number for ranking purposes. Omit this 
 * param to make list use internal index to insert item in order
 * @api public
 */

List.prototype.insert = function(data, sortScore, forcesave=true) {

	var self=this;
	
	return new Promise((resolve, reject) =>{
		
		if ( typeof(data.key) !== "undefined" && data.key !== null )
		{
			// console.log("list insert(): data key",  data.key);
			self.add(data.key, sortScore).then((res)=>{

				console.log("list insert(): add result ",  res);
				console.log("list insert(): forcesave ",  forcesave);
				if (forcesave) {
					return self.hmset.call(self, data.key, data);
				}else{
					return res;
				}
					
			}).then((res)=>{

				console.log("list insert(): final result ",  res);
				resolve(res);
			});	
		}else
			reject("missing key property in data");

	});
};


/**
 * Remove id from list.
 *
 * If second argument is true, it also
 * deletes hash options (if exists).
 *
 * Examples:
 *
 *   list.del(12, cb);
 *   list.del(13, true, cb);
 * 
 * @param  {String}   key [description]
 * @param  {Function | Boolean} cb optional
 * @param  {Function} fn optional
 * @api public
 */

List.prototype.del = function(key, erase=false) {


	var self = this;
	
	return new Promise((resolve, reject) =>{

		self.client.zremAsync(self.name, key).then((result)=>{
			// console.log("erase ", erase);
			if(erase) {
				console.log("deleting ", key);
				self.client.del(key);
			}
			self.decr().then(()=>{});
			resolve(result > 0);
		}).catch((err)=>{
			reject(err);
		});
	});

	
};


/**
 * Check if id exists in list.
 *
 *   
 * @param  {String}   key 
 * @api public
 */

List.prototype.has = function(key) {

	var self = this;

	return new Promise((resolve, reject) =>{
		self.client.zrankAsync(this.name, key).then((result)=>{
			// console.log("List.prototype.has ", result);
			resolve(typeof result === "number");
		}).catch((err)=>{
			reject(err);
		});
	});

};


/**
 * Get options for given id.
 *
 * Hashes can exist even if id is
 * not in the list.
 *
 * Examples:
 *
 *  list.get(12, cb);
 * 
 * @param  {Integer} id
 * @param  {Function} cb
 * @api public
 */

List.prototype.get = function(key, cb) {
	//NOTE: should we check if in list?
	this.client.hgetall(key, cb);
};

List.prototype.getAll = function() {

	var self = this;
	
	return new Promise((resolve, reject) =>{
		self.client.zrangeAsync(self.name, 0, -1).then((items)=>{
			resolve(items);
		}).catch((err)=>{
			if (err) reject(err);
		});
	});
};


List.prototype.count = function()
{
	var priv = PRIVATE.get(this);
	var self = this;
	
	return new Promise((resolve, reject) =>{
		self.client.getAsync(priv.countKey).then((count)=>{
			if (typeof count !== "undefined" &&
				count !== null ){
				resolve(++count);
			}else{
				resolve(0);	
			}
						
		}).catch((err)=>{
			if (err) reject(err);
		});
	});	
};


List.prototype.getAllInRange = function(minIndex, maxIndex) {
	
	var self = this;

	return new Promise((resolve, reject) =>{
		self.client.zrangeAsync(self.name, minIndex, maxIndex).then((items)=>{
			resolve(items);
		}).catch((err)=>{
			if (err) reject(err);
		});
	});
};

/**
 * Returns the key for the item stored in the list at specified index.
 * Use get() to retrieve the object or use your own deserialisation method.
 * @param {Integer} index 
 */
List.prototype.getByIndex = function(index) {

	var self = this;
	
	return new Promise((resolve, reject) =>{
		self.client.zrangeAsync(self.name, index, index).then((items)=>{

			if (Array.isArray(items) && items.length > 0)
				resolve(items[0]);
			else if (Array.isArray(items) && items.length == 0)
				resolve(null);
	
			// 	//NOTE: should we check if in list?
			// this.client.hgetall(key, cb);
	
		}).catch((err)=>{
			if (err) reject(err);
		});
	});
};

/**
 * Move set into an other list.
 *
 * Atomically removes the set of the list
 * stored at source, and pushes the set to
 * the list stored at destination.
 *
 * Examples:
 *
 *   list.move(12, otherList, cb);
 * 
 * @param  {Integer}   id 
 * @param  {List}   list 
 * @param  {Function} cb
 * @api public
 */

List.prototype.move = function(id, list, cb) {
	this.del(id, function(err) {
		if(!err) list.add(id, cb);
	}.bind(this));
};


List.prototype.removeAll = function(deleteItems=true)
{
	var self = this;
	
	// this.client.set(priv.countKey, -1);
	var promises = [];

	self.getAll().then((items)=>{
		items.forEach(itemKey => {
			// console.log("removing ", itemKey);
			var p = self.del(itemKey, deleteItems);
			promises.push(p);
		});
	});

	return Promise.all(promises);
};


List.prototype.cleanUp = function(eraseItems=true)
{
	var self = this;
	var priv = PRIVATE.get(this);
	return new Promise((resolve, reject) =>{

		self.removeAll(eraseItems).then(()=>{
			// console.log("deleting ", priv.countKey);
			self.client.del(priv.countKey);			
			resolve(true);
		}).catch((err)=>{ reject(err); });
	});
	
};