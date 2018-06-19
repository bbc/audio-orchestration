/****************************************************************************
/* FILE:                PersistedArrayContainer.js                            				*/
/* DESCRIPTION:         Extension of the Array class to perform lazy loading */
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

var PRIVATE = new WeakMap();

/**
 * @class PersistedArrayContainer
 * 
 * @classdesc A wrapper class for an array to store and manage a list of
 * objects of a single type. The class persists the array elements in
 * a datastore (e.g. Redis) and uses lazy loading for retrieval.
 * The array contains string identifiers for objects or objects. When an array
 * element of type string is accessed, the accessor call is intercepted and the 
 * corresponding object is fetched from the data store and returned.
 * 
 * If a string array element has no corresponding object in the data store,
 * the string element is returned.
 * Adding an object to the array will cause it to be persisted in the data store.
 * The object added to Redis via the object's persist() method.
 */
class PersistedArrayContainer{

	constructor(array, elemType, datastore, parentKey, objAsyncLoaderFn)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
		priv.array = array || [];
		priv.elemType = elemType;
		priv.ds = datastore;
		priv.parentKey = parentKey;
		priv.objAsyncLoaderFn = objAsyncLoaderFn;
		

		priv.arrayProxy = new Proxy(array, {
			
			get: function(target, name, receiver)
			{
				// console.log("IN PROXY >>>>>");
				// console.log(name);


				if (name in target.__proto__)
				{
					var propValue = target[name];

					if (typeof propValue === "function"){

						return function(){
							//console.log("intercepting call to " + name);
							// console.log(arguments);
							//"this" points to the proxy, is like using the "receiver" that the proxy has captured
							
							if (name==="push")
							{
								if (typeof arguments[0].persist === "function")
								{
									// console.log("PUSH(): calling persist() on object");
									// console.log(typeof priv.ds);
									arguments[0].persist.call(arguments[0], priv.ds);
								}
							}
							
							return propValue.apply(target, arguments);
						};
					}
					else
					{
						return target[name];			
					}
				}

				if (name in target)  {
					var value = target[name];
					
					if (typeof value !== "function"){
						if (target[name] instanceof priv.elemType) 
							return new Promise((resolve)=>{
								resolve(target[name]);
							});
						else if (typeof target[name] === "string")
						{
							return  new Promise((resolve) =>{

								priv.objAsyncLoaderFn(target[name], priv.parentKey, priv.ds).then((item)=>
								{
									// lazy loading, set element in array to retrieved object
									target[name] = item;
									resolve(target[name]);
								}).catch((error)=>{
									resolve(target[name]);
								});
							});
						
						}
					}
					else
					{
						return target[name];			
					}
				}				
			},

			has : function(target, prop) {
				// console.log(">>>>>>>>>>>>>>>>>");
			},

			set: function(target, prop, value, receiver) {
				
				// console.log("property set: " + prop + " = " + value);
				// console.log(value instanceof priv.elemType);
				
				// console.log("xxxxxxxxxxxxxxxxx");
				// console.log(typeof priv);

				if (typeof value.persist == "function")
				{
					//console.log("calling persist() on object");
					
					value.persist.call(value, priv.ds);
				}
				target[prop] = value;

				return true;
			}
		});	 

	}

	
	get array()
	{
		var priv = PRIVATE.get(this);
		return priv.arrayProxy; 
	}


}

module.exports = PersistedArrayContainer;



