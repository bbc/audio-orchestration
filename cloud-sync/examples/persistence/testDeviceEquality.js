// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("../../src/service/state/Timeline");
const Device = require("../../src/service/state/Device");
var RedisConnection = require("../../src/service/datastore/redisconnection"); 

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
var wallclockservice_udp = { serviceName: "wallclockservice-6677"};
var wallclockservice_ws = { serviceName: "wallclockservice-6676"};
var mosquitto = { serviceName: "mosquitto-1883"};
var redis = { serviceName: "redis"};
var redisClient;

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
				//console.log("Found " + args.serviceName + "  endpoint at: " + serviceNodes[0].ServiceAddress + ":" + serviceNodes[0].ServicePort);
				resolve(serviceEndpoint);
			}
		});
	});
}
	
		
discoverService(wallclockservice_udp)
	.catch(function(result) {
		return Promise.retry(discoverService, wallclockservice_udp, 10, 2000);
	})
	.then(function(result){
		wallclockservice_udp = result;
		console.log("Discovered Wallclock Service " + JSON.stringify(wallclockservice_udp));
		return discoverService(wallclockservice_ws);
	})
	.catch(function(result) {
		return Promise.retry(discoverService, wallclockservice_ws, 10, 2000);
	})
	.then(function(result){
		wallclockservice_ws = result;
		console.log("Discovered Wallclock Service " + JSON.stringify(wallclockservice_ws));
		return discoverService(mosquitto);
	})
	.catch(function(result){
		return Promise.retry(discoverService, mosquitto, 10, 2000);
	})
	.then(function (result) {
		mosquitto = result;
		console.log("Discovered Mosquitto Service:", JSON.stringify(mosquitto));
		return discoverService(redis);
	})
	.catch(function(result){
		return Promise.retry(discoverService, redis, 10, 2000);
	})	
	.then(function (result) {
		redis = result;
		console.log("Discovered Redis Service:", JSON.stringify(redis));
		setup();
		runTests();
	});

// ---------------------------------------------------------
// setup
// ---------------------------------------------------------



function setup()
{
	console.log("connecting to Redis endpoint " + JSON.stringify(redis));
	redisClient = RedisConnection("DEFAULT", redis);

	redisClient.on("error", function (err) {
		console.log("Redis connection Error : " + err);
	});
	console.log("connected to redis.");
}


function runTests()
{

	console.log("TEST 1: Add device dev78 to Redis");
	var t1 = new Timeline("timeline3456", "123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/timeline3456/state", "dev78", "Device" );
	// var t2 = new Timeline("xyz456", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/xyz456/state", "dev78", "Device");

	var mydevice = new Device("dev78", "123", "floor1", "/sessions/123/devices/dev78/RESP", [],redisClient);

	mydevice.persistAsync(redisClient).then((result)=>{
		console.log("TEST 2: mydevice persist result: "+ result);
		console.log("TEST 2: Adding timeline timeline3456 to device ...");

		return mydevice.addTimeline("timeline3456","123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/timeline3456/state", "dev78", "Device");
	}).then((result)=>{

		console.log("TEST 2: timeline timeline3456 stored correctly: ", result );

		console.log("TEST 3: Get timeline timeline3456 from device...");
		return mydevice.getTimeline("timeline3456");


	

		// return mydevice.addTimeline("timeline21212","123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/timeline21212/state", "dev78", "Device");
	}).then((timeline)=>{
	 	console.log("TEST 3: timeline timeline3456 stored correctly: " + timeline.serialise());
		
	// 	console.log(mydevice.timelines);		
				
	// 	return Device.getFromDataStore("dev78","123", redisClient);
	// }).then((device)=>{
	// 	console.log("Original => " + mydevice.serialise());
	// 	console.log("From DB =>  " + device.serialise());


	

	// 	// mydevice.equals(device).then(result=>{
	// 	// 	console.log("device dev78 stored correctly: ", result );
	// 	// });
		

		

	 })
	.catch((error)=>{
		console.log(error);
	});


}
