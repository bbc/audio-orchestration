// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("../../src/service/state/Timeline");
const Device = require("../../src/service/state/Device");
const Context = require("../../src/service/state/Context");
const Session = require("../../src/service/state/Session");
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

var t1, t2, t3;
var session123;
var rajiv_ipad;

function setup()
{
	console.log("connecting to Redis endpoint " + JSON.stringify(redis));
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

	
	if (typeof Session === "undefined")
		throw new Error("error importing Context");

	// console.log("Test 1: create and persist a session object");
	// var rajivHomeContext = new Context("rajiv_home_floor1", "123", [], redisClient);
	// session123 = new Session("123", [rajivHomeContext], redisClient, "SyncDemo");

	var mysession;

	Session.getFromDataStore("rajiv_sync_session", redisClient).catch((error)=>{
		console.log("unknown context search result: " + error);
	}).then((session)=>{
		if (session)
		{
			console.log("TEST 1: session found");
			mysession = session;
			console.log(session.serialise());
		}else
		{
			console.log("TEST 1: Session not found");
			console.log("TEST 1: Create and persist new session");
						
			mysession = new Session("rajiv_sync_session", [], redisClient, "SyncDemo");
		}
		console.log("TEST 2: mysession persist ");
			
		return mysession.persistAsync(redisClient);	
	}).then((result)=>{
		console.log("TEST 3: Add a context ");

		return mysession.addContext("rajiv_home_ctx");
	}).then((result)=>{
		console.log("TEST 3: Add a context result");
		console.log(result);

		return mysession.addDeviceToContext("rajiv_iphone", "/sessions/rajiv_sync_session/devices/rajiv_iphone/RESP", "rajiv_home_ctx");

	}).then((result)=>{
		console.log(result);
		printSession(mysession);

		console.log("TEST 4: Get context");
		return mysession.getContext("rajiv_home_ctx");
	}).then((context)=>{
		console.log(context);
		console.log("TEST 5: Add timeline to device using session.addTimelineToDevice(");
		return mysession.addTimelineToDevice("video2timeline", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/rajiv_sync_session/timelines/video2timeline/state", "rajiv_iphone", context.id);
		
	}).then((result)=>{
		console.log(result);
		
		return mysession.cleanUp(redisClient);
	}).then((result)=>{
		console.log("cleanup result ", result );
		
	}).catch((error)=>{
		console.log(error);
	});

	





	// // ---------------------------------------------------------
	// // Test 1 create and persist a session object
	// // ---------------------------------------------------------


	// session123.persistAsync(redisClient).then((result)=>{
	// 	console.log("session123 persist result: "+ result);
	// 	console.log("Checking context " + rajivHomeContext.id + "  persistence ...");
	// 	return Context.getFromDataStore(rajivHomeContext.id, session123.id, redisClient);

	// }).then((context)=>{
	// 	if (context)
	// 		console.log("context: ",  context.serialise());

	// 	// var device1 = new Device("dev56", "123", "rajiv_home_floor1", "/sessions/123/devices/dev56/RESP", [t1],redisClient);
	// 	console.log("Checking session object " + session123.id + "  persistence ...");
	// 	return Session.getFromDataStore(session123.id, redisClient);
	// }).then((session)=>{
	// 	if (session)
	// 		console.log("session : ", session.serialise());


	// 	return Device.getFromDataStore("rajiv_iphone",session.id, redisClient);
	// }).then((result)=>{
	// 	if (result) console.log("Device rajiv_iphone exists in data store: " + result.serialise());
		
	// 	// ---------------------------------------------------------
	// 	// Test 2:  Add device to context object in session object
	// 	// ---------------------------------------------------------
	// 	console.log("Test 2:  Add device to context object in session object");
	// 	return session123.addDeviceToContext("rajiv_iphone", "/sessions/123/devices/rajiv_iphone/RESP", rajivHomeContext.id);

	// }).then((device)=>{
	// 	if (device)
	// 		console.log("device add result: ", device.serialise());
		

	// 	// ---------------------------------------------------------
	// 	// Test 3:  Add another device to context object in session object
	// 	// ---------------------------------------------------------
	// 	console.log("Test 2:  Add another another device with a few timelines ....");

	// 	return session123.getContext(rajivHomeContext.id);
	// }).then((context)=>{
	
	// 	console.log("Test 2 context: ",  context.serialise());

	// 	t1 = new Timeline("abc1234", "123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/abc1234/state", "rajiv_iphone", "Device" );
	// 	t2 = new Timeline("xyz456", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/xyz456/state", "rajiv_ipad", "Device");
	// 	t3 = new Timeline("pqr345", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/pqr345/state", "rajiv_ipad", "Device");

	// 	rajiv_ipad = new Device("rajiv_ipad", "123", "rajiv_home_floor1", "/sessions/123/devices/dev56/RESP", [t3],redisClient);

	// 	context.devices.push(rajiv_ipad);
	// 	console.log("Test 2a:  Find device by Id using context.getDevice() ....");
	// 	return context.getDevice(rajiv_ipad.id);
	// }).then((device)=>{
	// 	if (device)
	// 		console.log("Test2a: device: ", device.serialise());
	// 	console.log("Test 2b:  Add timeline to existing device ....");
	// 	device.timelines.push(t2);
	// 	console.log("Test2b: Device with new timeline: ", device.serialise());

	// 	console.log("Test 2c:  Find and print context object in session using session.getContext() ....");
	// 	return session123.getContext(rajivHomeContext.id);
	
	// }).then((context)=>{
	
	// 	console.log("Test 2c: context found: ", context.serialise());
		
	// 	// ---------------------------------------------------------
	// 	// Test 4:  Find known device in session object
	// 	// ---------------------------------------------------------
	// 	console.log("Test 4:  Find known device in session object");

	// 	return session123.findDevice(rajiv_ipad.id, rajivHomeContext.id);
	// }).then((device)=>{
	
	// 	if (device)
	// 		console.log("Test 4: found device: ", device.serialise());
	// 	else
	// 		console.log("Test 4: device not found.");

	// 	// ---------------------------------------------------------
	// 	// Test 5:  Find known device using session.findDevice(deviceid)
	// 	// ---------------------------------------------------------
	// 	console.log("Test 5:  Find known device using session.findDevice(deviceid)");
	// 	return session123.findDevice(rajiv_ipad.id);
	// }).then((device)=>{
		
	// 	if (device)
	// 		console.log("Test5: found device: ", device.serialise());
	// 	else
	// 		console.log("Test 5: device not found.");
	
	// 	// ---------------------------------------------------------
	// 	// Test 5:  Find known device using session.findDevice(deviceid)
	// 	// ---------------------------------------------------------
	// 	console.log("Test 5:  Remove known device using session.removeDeviceFromContext()");
	// 	return session123.removeDeviceFromContext(rajiv_ipad.id, rajivHomeContext.id);
	// }).then((result)=>{
		
	// 	console.log("Test 5: device ", rajiv_ipad.id , " removed?", result);
	// 	console.log(rajivHomeContext.serialise());

	// 	// ---------------------------------------------------------
	// 	// Test 5:  Add timeline to a known device
	// 	// ---------------------------------------------------------
	// 	console.log("Test 6:  Add timeline to device using session.addTimelineToDevice()");

	// 	// t1 = new Timeline("abc1234", "123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/abc1234/state", "rajiv_iphone", "Device" );
		
	// 	return session123.addTimelineToDevice("abc1234", "http://bbc/videostream1", 
	// 		"urn:timeline:ct", "/sessions/123/timelines/abc1234/state",
	// 		"rajiv_iphone", rajivHomeContext.id);

	// }).then((result)=>
	// {
	// 	console.log("Test 6 result: ", result);

	// 	return session123.findDevice("rajiv_iphone");
	// }).then((device)=>{
		
	// 	if (device){
	// 		console.log("Test6: fetch device: ", device.serialise());


	// 		return device.getTimeline("abc1234");
	// 	}
			
	// 	else
	// 		console.log("Test 6 failure.");
	// }).then((timeline)=>{

	// 	console.log("Test 6 timeline: " + timeline.serialise());
	// 	if ((timeline) && (timeline.providerId === "rajiv_iphone")
	// 	&& (timeline.id === "abc1234")
	// 	&& (timeline.contentId === "http://bbc/videostream1")
	// 	&& (timeline.timelineType === "urn:timeline:ct"))
	// 		console.log("Test 6 success.");
	// })

	// 	.catch((error)=>{

	// 		console.log(error);
	// 	});


	function printSession(mysession)
	{
		console.log("-------- Mysession contexts -----------");
		console.log("Number of contexts: " + mysession.contexts.length);

		for(let d of mysession.contexts)
		{
			if (d instanceof Context){
				console.log(d.id + ": " + d.serialise());

				for(let t of d.devices)
				{
					if (t instanceof Device)
					{
						console.log(d.id + "->" + t.id + ": " + t.serialise());
					}else console.log(t);
				}
			}
				
			else console.log(d);
		}
		console.log("--------------------------------------");
	}
}



