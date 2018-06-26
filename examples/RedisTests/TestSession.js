// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("./statev2/Timeline");
const Device = require("./statev2/Device");
const Session = require("./statev2/Session");
const TimelineSourceType = require("./statev2/TimelineSourceType");
var RedisConnection = require("./datastore/redisconnection");
var uuidv4 = require("uuid/v4"); 
var SyncTLElection = require("./statev2/SyncTLElection");

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
var wallclockservice_udp = { serviceName: "wallclock-service-6677"};
var wallclockservice_ws = { serviceName: "wallclock-service-6676"};
var mosquitto = { serviceName: "mqttbroker-1883"};
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

var t1, t2, t3;
var session123;
var rajiv_ipad;
var device1, mysourceType, syncTL1;

function setup()
{
	console.log("connecting to Redis endpoint " + JSON.stringify(redis));
	redis.host = "127.0.0.1";
	redisClient = RedisConnection("DEFAULT", redis);

	redisClient.on("error", function (err) {
		console.log("Redis connection Error : " + err);
	});
	console.log("connected to redis.");
}



// ---------------------------------------------------------
// Tests
// ---------------------------------------------------------

function runTests()
{

	console.log("Running Tests");
	
	if (typeof Session === "undefined")
		throw new Error("error importing Context");

	t1 = new Timeline("abc1234", "motogp_1", "http://bbc/videostream1", 
		"urn:timeline:ct", 1000,
		"/sessions/rajiv_session_1/timeline/abc1234/state", "rajiv_iphone", "Device", true, false, 
		"urn:wallclock", {
			parentTime:1520761765519.4998, childTime:1, initialError :0.0144638570032, errorGrowthRate :0
		},
		{
			wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
		});
	
	t2 = new Timeline("xyz456", "motogp_1", "http://bbc/videostream2", 
		"urn:timeline:ct", 1000,
		"/sessions/rajiv_session_1/timeline/xyz456/state", "rajiv_ipad", "Device", true, false, 
		"urn:wallclock", {
			parentTime:1520761765519.4998, childTime:1, initialError :0.0344638570032, errorGrowthRate :0
		},
		{
			wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
		});

	var mysession;

	Session.getFromDataStore("motogp_1", redisClient).catch((error)=>{
		console.log("unknown session search result: " + error);
	})
		.then((session)=>{
			if (session)
			{
				console.log("TEST 1: session found");
				mysession = session;
				// console.log(session.serialise());
			}else
			{
				
				console.log("TEST 1: Session not found");
				console.log("TEST 1: Create and persist new session");	
				mysession = new Session("motogp_1", "SyncDemo", SyncTLElection.EARLIEST_FIRST, redisClient, true);					
				
			}
			console.log("TEST 2: mysession persistence test ");
			
			
			return Session.getFromDataStore(mysession.id, redisClient);	
		})
		.then((session)=>{
			console.log(session.serialise());
			console.log("TEST 2: session persisted correctly? ", mysession.equals(session));

			console.log("TEST 3: Add a device to session");

			device1 = new Device("rajiv_iphone", "motogp_1", "living room", "/sessions/motogp_1/devices/rajiv_iphone/RESP", "/sessions/motogp_1/devices/rajiv_iphone/REQ", redisClient, true);

			return Device.getFromDataStore("rajiv_iphone", "motogp_1", redisClient);

		})
		.then((device)=>{
			console.log(device.serialise());
		 	return mysession.addDevice(device1, true);
		})
		.then((result)=>{
			console.log(result);
			rajiv_ipad = new Device("rajiv_ipad", "motogp_1", "living room", "/sessions/motogp_1/devices/rajiv_iphone/RESP", "/sessions/motogp_1/devices/rajiv_iphone/REQ", redisClient, true);
			return mysession.addDevice(rajiv_ipad, true);

		})
		.then(()=>{
			console.log("TEST 4: session getDevices()");
			return mysession.getDevices();
	
		})
		.then((devices)=>{
			console.log(devices);
			console.log("TEST 4: session getDevice()");
			return mysession.getDevice("rajiv_iphone");
		})
		.then((device)=>{
			console.log(device.serialise());
			var key = TimelineSourceType.storageKey("motogp_1", t1.contentId, t1.timelineType);
			console.log("TEST 4a: session TimelineSourceType.getFromDataStore(%s): ", key);
			
			return TimelineSourceType.getFromDataStore("motogp_1", t1.contentId, t1.timelineType, redisClient);
		})
		.then((sourceType)=>{
			console.log(sourceType);
			console.log("TEST 5: session getTimelines() before adding");
			return mysession.getTimelines();
		})
		.then((timelines)=>{
			console.log(timelines);
			console.log("TEST 6: session getTimeline() before adding");
			return mysession.getTimeline(t1.id);
		})		
		.then((timeline)=>{
			console.log(timeline);
			console.log("TEST 7: session addTimeline(), add timeline %s to session", t1.id);
			return mysession.addTimeline(t1, true);
		})	
		.then((result)=>{
			console.log("TEST 7: addTimeline() result: ", result);
			console.log("TEST 8: session getTimelines() after adding");
			return mysession.getTimelines();
		})
		.then((timelines)=>{
			console.log(timelines);
			console.log("TEST 9: session getTimeline() after adding");
			return mysession.getTimeline(t1.id);
		})
		.then((timeline)=>{
			console.log(timeline);
			console.log("TEST 10: session getTimelineSourceType after adding");
			return TimelineSourceType.getFromDataStore("motogp_1", t1.contentId, t1.timelineType, redisClient);
		})
		.then((sourceType)=>{
			console.log(sourceType.serialise());
			console.log("TEST 11: check if  TimelineSourceType contains timeline");

			mysourceType = sourceType;

			return sourceType.getTimelines();
		
		})
		.then((timelines)=>{
			
			console.log(timelines);
			console.log("TEST 12: Add another timeline to session");

			return mysession.addTimeline(t2,true);
		
		})
		.then((result)=>{
			
			console.log("TEST 12: result ", result);
			console.log("TEST 13:  session contains timeline", t2.id);
			return mysession.hasTimeline(t2.id);
		
		})
		.then((result)=>{
			
			console.log("TEST 13: result ", result);
			console.log("TEST 14:  Remove device %s from session. And check if device timelines are removed from all lists.", rajiv_ipad.id);
			return mysession.removeDevice(rajiv_ipad.id);
		
		})
		.then((result)=>{
			
			console.log("TEST 14a: ssession's timelines list");
			return mysession.getTimelines();
		
		})
		.then((timelines)=>{
			
			
			console.log(timelines);
			console.log("TEST 14b: session's timelines list");
			return mysession.timelines.getAll();
		
		})
		.then((timelines)=>{
			
			console.log("mysession.timelines.getAll() => ");			
			console.log(timelines);
			console.log("TEST 14b:  timelines list has timeline %s? ", t2.id);
			return mysession.hasTimeline(t2.id);
		
		})
		.then((result)=>{		
				
			console.log("TEST 14b: result should be false:  ", result);

			console.log("TEST 14c: Check if timeline was removed from session's timelinesourcetype list");
			return mysession.getTimelineSourceType(t2.contentId, t2.timelineType);
		
		})
		.then((sourceType)=>{
			if (sourceType!==null) 
			{
				console.log(sourceType.serialise());
				return sourceType.getTimeline(t2.id);
			}
			else {
				console.log("sourcetype is null?", sourceType===null);
				return null;
			}
			
		})
		.then((timeline)=>{
			
			console.log("TEST 14b result should be null, result is null? ", timeline===null);



			// t1 = new Timeline("abc1234", "motogp_1", "http://bbc/videostream1", 
			// "urn:timeline:ct", 1000,
			// "/sessions/rajiv_session_1/timeline/abc1234/state", "rajiv_iphone", "Device", true, false, 
			// "urn:wallclock", {
			// 	parentTime:1520761765519.4998, childTime:1, initialError :0.0144638570032, errorGrowthRate :0
			// },
			// {
			// 	wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
			// });
			
			syncTL1 = new Timeline(uuidv4(), t1.sessionId, t1.contentId, t1.timelineType, t1.frequency, 
				t1.channel,t1.providerId, t1.providerType, t1.useForSessionSync, t1.writable,
				t1.parentTL, t1.parentTLCorr, t1.lastTimestamp);  

			console.log("TEST 15: Adding a synctimeline");
			console.log("TEST 15: first check that synctimelines list has 0 members");

			return mysession.getSyncTimelines();
		}).then((synctimelines)=>{
			console.log("TEST15: Session has zero sync timelines: ", synctimelines.length === 0);

			return mysession.addSyncTimeline(syncTL1, true);
		})
		.then((result)=>{
			console.log("TEST 15: add synctimeline result: ", result);



			console.log("TEST 16: Session Cleanup ");
			return mysession.cleanUp();
		
		})
		.then((result)=>{
			console.log("cleanup result ", result );
			console.log("TEST 17: check if TimelineSourceType  deleted after cleanup");
			return TimelineSourceType.getFromDataStore("motogp_1", t1.contentId, t1.timelineType, redisClient);
		})
		.then((sourceType)=>{
			if (sourceType!==null) console.log(sourceType.serialise());
			else console.log("sourcetype is null?", sourceType===null);
		})
		.catch((error)=>{
			console.log(error);
		});

}



