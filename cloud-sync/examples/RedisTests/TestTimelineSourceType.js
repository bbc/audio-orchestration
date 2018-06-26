// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("./statev2/Timeline");
const Device = require("./statev2/Device");
const TimelineSourceType = require("./statev2/TimelineSourceType");
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

var t1,t2;
var mydevice;
var sourceType;


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

	t1 = new Timeline("abc1234", "rajiv_session_1", "http://bbc/videostream1", 
		"urn:timeline:ct", 1000,
		"/sessions/rajiv_session_1/timeline/abc1234/state", "dev56", "Device", true, false, 
		"urn:wallclock", {
			parentTime:1520761765519.4998, childTime:1, initialError :0.0144638570032, errorGrowthRate :0
		},
		{
			wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
		});
	
	t2 = new Timeline("xyz456", "rajiv_session_1", "http://bbc/videostream2", 
		"urn:timeline:ct", 1000,
		"/sessions/rajiv_session_1/timeline/xyz456/state", "dev56", "Device", true, false, 
		"urn:wallclock", {
			parentTime:1520761765519.4998, childTime:1, initialError :0.0344638570032, errorGrowthRate :0
		},
		{
			wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
		});


	console.log("TEST 1: Add device dev56 to Redis");
							
	mydevice = new Device("dev56", "rajiv_session_1", "floor1", "/sessions/123/devices/dev56/RESP", null, redisClient);
	mydevice.persistAsync(redisClient)
		.then((result)=>{
			console.log("TEST 1: mydevice persist result: "+ result);
			
			console.log("TEST 2: Add timeline abc1234  ...");
			return mydevice.addTimeline(t1, true);
		})
		.then((result)=>{
			console.log("TEST 2: add timeline abc1234 result", result);

			return mydevice.getTimelines();

		})
		.then((result)=>{
			console.log("TEST 2: timelines in device ", mydevice.id, " ...");
			console.log(result);	

			console.log("TEST 2: Checking timeline abc1234 persistence ...");
			return Timeline.getFromDataStore("abc1234", "rajiv_session_1", redisClient);
		})
		.then((timeline)=>{
			console.log("TEST 2: timeline abc1234 stored correctly: " + timeline.equals(t1));


			console.log("TEST 3: create timelinesourcetype object ...");


			sourceType = new TimelineSourceType(t1.sessionId, t1.contentId, t1.timelineType, redisClient); 
			
			return sourceType.persistAsync(redisClient);
		})
		.then((result)=>{	

			console.log("TEST 3: sourceType persist result: " + result);
		
			return sourceType.addTimeline(t1);
		})

		.then(()=>{	

			console.log("TEST 4: add another timeline to device");
		
			return mydevice.addTimeline(t2, true);
		})
		.then(()=>{
			console.log("TEST 4: check if timeline ", t2.id," stored correctly ");
		
			return mydevice.hasTimeline(t2.id);
		})
		.then((result)=>{
			console.log("TEST 4: device contains timeline ", t2.id," ? ", result);
		
			return sourceType.addTimeline(t2);
		}).then(()=>{
			console.log("TEST 5: check sourcetype timelines");
		
			return sourceType.getTimelines();
		}).then((timelines)=>{
			console.log( timelines);
			console.log("TEST 5: check gettimeline(), retrieve %s from datastore ", t2.id);
			return sourceType.getTimeline(t2.id);	
		})
		.then((timeline)=>{

			console.log("TEST 5: gettimeline() works, timeline  ", t2.id," stored correctly: " + timeline.equals(t2));

			console.log("TEST 6: Test removeTimeline(): remove %s from sourceType", t1.id);
			return sourceType.removeTimeline(t1.id);
		})
		.then((result)=>{
			console.log( t1.id + "removed from device? " + result);

			return sourceType.getTimelines();
		})
		.then((timelines)=>{
			console.log( timelines);
			console.log("TEST 5: check if timeline %s was erased, retrieve from datastore ", t1.id);
			return Timeline.getFromDataStore(t1.id, t1.sessionId, redisClient);					
		}
		).then((timeline)=>{
			if (timeline !== null){
				console.log("Timeline " ,t1.id," still in datastore");
			}
			console.log("TEST 6: sourceType %s cleanup ", sourceType.key);
			return  sourceType.cleanUp();					
		})
		.then((result)=>{
			console.log( sourceType.key + " cleaned from datastore? " + result);
			
			return sourceType.timelines.count();
		})
		.then((count)=>{
			console.log( sourceType.key + " num timelines:" + count);

			return redisClient.existsAsync(" session:rajiv_session_1:source:http://bbc/videostream1type:urn:timeline:ct:timelines:count");

			// return Timeline.getFromDataStore(t2.id, t2.sessionId, redisClient);
		})
		.then((result)=>{
			console.log("count key exists? ", result);

			return  redisClient.existsAsync(sourceType.key);

		})
		.then((result)=>{
			console.log("source key exists? ", result);
			console.log("Try to retrieve deleted sourcetype from datastore ... ");
			return TimelineSourceType.getFromDataStore(t1.sessionId, t1.contentId, t1.timelineType, redisClient);
		})
		.then((result)=>{
			console.log("sourcetype: ");
			console.log(result);

			
		})
		.catch((error)=>{
			console.log(error);
		});
}
