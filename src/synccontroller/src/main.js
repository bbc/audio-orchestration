/****************************************************************************
/* FILE:                main.js                								*/
/* DESCRIPTION:         Sync Controller service					 	        */
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



// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
var commandLineArgs = require("command-line-args");
var SyncController = require("./SyncController");
const Logger = require("./logger");
const url = require("url");



const kSyncControllerQueueKey = "cloudsync_synccontroller_waitQueue";
const kredisQMonitorPort = 3002;

// ---------------------------------------------------------
//  Local state
// ---------------------------------------------------------

var consulClient;
var syncController;


/**
 * names of services to use for service lookup (partial matching supported)
 */
var config = {
	consulURL: undefined,
	wallclockservice_ws: { name: "wallclock", port: 6676 },
	wallclockservice_udp: { name: "wallclock", port: 6677 },
	mqttbroker: { name: "mqttbroker", port: 1883 },
	redis: { name: "redis"},
	SyncControllerQueueName: kSyncControllerQueueKey, 
	monitor: {
		enabled: true,
		host: "127.0.0.1",
		port: kredisQMonitorPort,
	},
	messageConsumeTimeout :2000
};



/**
 * Discovered services from Consul after pattern match 
 */
var consulServiceNames = {
	wallclockservice_udp: undefined,
	wallclockservice_ws: undefined,
	mqttbroker: undefined,
	redis: undefined
};

/**
 * Discovered service endpoints of the type {host: <address>, port: <integer>}
 */
var services = {
	wallclockservice_udp: undefined,
	wallclockservice_ws: undefined,
	mqttbroker: undefined,
	redis: undefined
};


// ---------------------------------------------------------


// ---------------------------------------------------------
//   Service discovery 
// ---------------------------------------------------------

Promise.retry = function(fn, args, times, delay) {
	return new Promise(function(resolve, reject){
		var error;
		var attempt = function() {
			if (times == 0) {
				reject(error);
			} else {
				fn(args).then(resolve).catch(
					function (e) {
						times--;
						error = e;
						setTimeout(function () { attempt(); }, delay);
					}
				);
			}
		};
		attempt();
	});
};

// ---------------------------------------------------------


function lookupServiceName(name, port){

	return new Promise((resolve, reject)=>{

		consulClient.catalog.service.list((err, res)=>{
			if (err) reject(err);
			else { 
				var services = Object.keys(res);
				// console.log(services);
				const s = services.find(service => { 

					if (typeof port !== "undefined")
						return (service.includes(name) && service.includes(port));
					else{
						// console.log(service);
						// console.log(name);
						// console.log(service.includes(name));
						return service.includes(name);
					}
							
				} );
				if (typeof s === "undefined")
					reject(null);
				else
					resolve(s);
			}
		});
	});	
}

// ---------------------------------------------------------


/**
 * Discover a service host address and port number using a connected Consul service client
 * @param {Consul} consul a consul client created using {@link https://www.npmjs.com/package/consul|node-consul} library 
 * @param {string} serviceName 
 * @returns {Object} an anonymous object with properties: host and port
 */
function discoverService(serviceName)
{

	return new Promise(function(resolve, reject) {
		
		consulClient.catalog.service.nodes(serviceName, function(err, serviceNodes) {
						
			if (err){
				logger.info("Query for service " + serviceName + " failed.");
				reject(err);
			}
		
			else if (serviceNodes.length==0) {
				logger.info("no service registration for " + serviceName);
				reject(new Error("No service registration for " + serviceName));
			}
		
			else if ((typeof serviceNodes !== "undefined") && (serviceNodes.length > 0)) {
				var serviceEndpoint = { port: serviceNodes[0].ServicePort, host: serviceNodes[0].ServiceAddress};
				logger.info("Discovered ", serviceName, " : ", JSON.stringify(serviceEndpoint));
				resolve(serviceEndpoint);
			}
		});
	});
}


// ---------------------------------------------------------
//  Start
// ---------------------------------------------------------
var optionDefinitions = [
	{ name: "consul", alias: "c", type: String },
	{ name: "loglevel", alias: "l", type: String, defaultValue: "development" }
];

try {
	var options = commandLineArgs(optionDefinitions);
	var logger = Logger.getNewInstance(options.loglevel);

	// config
	config.consulURL = options.consul;
	config.loglevel = options.loglevel;
	process.env.loglevel = options.loglevel;

	const c = url.parse(config.consulURL);
	var consulOpt = {
		host: c.hostname,
		port: c.port
	};
	logger.debug("consul: ", consulOpt);


	consulClient = require("consul")(consulOpt);
	if (typeof consulClient === "undefined") {
		throw("Error connecting to Consul on " + consulOpt.host + ":" + consulOpt.port);
	}

	// discover services 
	lookupServiceName(config.wallclockservice_ws.name, config.wallclockservice_ws.port).then(
		function(serviceName){
			// console.log(serviceName);
			consulServiceNames.wallclockservice_ws = serviceName;
			return discoverService(consulServiceNames.wallclockservice_ws );
		}, function(err){
			logger.error("No wallclock WS services found. ", err );
		}
	).catch(function() {
		return Promise.retry(discoverService, consulServiceNames.wallclockservice_ws , 3, 2000);
	}).then(function(result){
		services.wallclockservice_ws = result;
		logger.info("Discovered Wallclock Service WS running on:" + JSON.stringify(services.wallclockservice_ws));
		return lookupServiceName(config.wallclockservice_udp.name, config.wallclockservice_udp.port);
	}).then(
		function(serviceName){
			// console.log(serviceName);
			consulServiceNames.wallclockservice_udp = serviceName;
			return discoverService(consulServiceNames.wallclockservice_udp );
		}, function(err){
			logger.error("No ", config.wallclockservice_udp.name, " services found.", err);
		}
	).catch(function() {
		return Promise.retry(discoverService, consulServiceNames.wallclockservice_udp , 3, 2000);
	}).then(function(result){
		services.wallclockservice_udp = result;
		logger.info("Discovered Wallclock Service UDP running on:" + JSON.stringify(services.wallclockservice_udp));
		return lookupServiceName(config.mqttbroker.name, config.mqttbroker.port);
	}).then(
		function(serviceName){
			// console.log(serviceName);
			consulServiceNames.mqttbroker = serviceName;
			return discoverService(consulServiceNames.mqttbroker );
		}, function(err){
			logger.error("No ", config.mqttbroker.name, " services found.", err);
		}
	).catch(function() {
		return Promise.retry(discoverService, consulServiceNames.mqttbroker , 3, 2000);
	}).then(function(result){
		services.mqttbroker = result;
		logger.info("Discovered mqttbroker service running on: " + JSON.stringify(services.mqttbroker));
		return lookupServiceName(config.redis.name, config.redis.port);
	}).then(
		function(serviceName){
			// console.log("******", serviceName);
			consulServiceNames.redis = serviceName;
			return discoverService(consulServiceNames.redis );
		}, function(err){
			logger.error("No ", config.redis.name, " services found. ", err);
		}
	).catch(function() {
		return Promise.retry(discoverService, consulServiceNames.mqttbroker , 3, 2000);
	}).then(function(result){
		services.redis = result;
		logger.info("Discovered redis service running on: " + JSON.stringify(services.redis));
		// console.log(services);

			
		setUpController(services);
		// CRTL-C handler
		process.on("SIGINT", function() {
			syncController.stop();
			process.exit();
		});
	});
	
} catch (e) {
	logger.error(e);
}


// ---------------------------------------------------------

/**
 * Create a SyncController
 */
function setUpController() {
	// console.log(config);
	syncController = new SyncController(services, config);
	SyncController.queueName = kSyncControllerQueueKey;

	syncController.start();

}
	

function cleanUp()
{

}