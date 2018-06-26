// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("./state/Timeline");
var RedisConnection = require("./datastore/redisconnection"); 

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
//  discover services and connect to Redis service
// ---------------------------------------------------------
var host_IP;
var redisService = { serviceName: "redis"};

var optionDefinitions = [
	{ name: "ip", alias: "i", type: String }
];

var options = commandLineArgs(optionDefinitions);

host_IP = options.ip;

if ((typeof(options.ip) === "undefined")) {
	throw("Error - ip parameter missing.");
}

console.log("host ipv4 address: "+ host_IP);

var consulOpt = {
	host: host_IP,
	port: 8500
};

var consul = require("consul")(consulOpt);

if (typeof consul === "undefined") {
	throw("Error connecting to Consul on " + consulOpt.host + ":" + consulOpt.port);
}

// ---------------------------------------------------------
//  discover and connect to services
// ---------------------------------------------------------

function discoverService (args) {

	return new Promise(function(resolve, reject) {

		consul.catalog.service.nodes(args.serviceName, function(err, serviceNodes) {
		
			if (err){
				console.log("Query for service " + args.serviceName + "   failed.");
				reject(err);
			}

			else if (serviceNodes.length==0) {
				console.log("no service registration for " + args.serviceName);
				reject(new Error("No service registration for " + args.serviceName));
			}

			else if ((typeof serviceNodes !== "undefined") && (serviceNodes.length > 0)) {
				var serviceEndpoint = { port: serviceNodes[0].ServicePort, host: serviceNodes[0].ServiceAddress};
				console.log("Found " + args.serviceName + "  endpoint at: " + serviceNodes[0].ServiceAddress + ":" + serviceNodes[0].ServicePort);
				resolve(serviceEndpoint);
			}
		});
	});
}

var redisClient;

discoverService(redisService)
	.catch(function(result) {
		return Promise.retry(discoverService, redisService, 10, 2000);
	})
	.then(function(result){
		redisService = result;
	
		// process.env.REDISCLOUD_URL = redisService.host + ":" + redisService.port;
	
		// console.log("Discovered Redis Service " + process.env.REDISCLOUD_URL);

		redisClient = RedisConnection("DEFAULT", redisService);
		
		redisClient.on("error", function (err) {
			console.log("Redis connection Error : " + err);
		});
		console.log("connected to redis.");

		
		redisClient.on("pmessage", notificationHandler);
		redisClient.psubscribe("__key*__:session:*:timeline:*");
		// redisClient.psubscribe("__key*__:del");


	}).catch(function(result){
		console.log(result);
	});



function notificationHandler(pattern, channel, message)
{
	console.log("(" + pattern + ") client1 received message on " + channel + ": message:" + message);
}