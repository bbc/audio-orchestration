// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("../../src/service/state/Timeline");
const Device = require("../../src/service/state/Device");
const Context = require("../../src/service/state/Context");
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

var t3;


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
	console.log("TEST 1: Lookup context in data store: ");
	var mycontext;
	var t1 = new Timeline("abc1234", "123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/abc1234/state", "dev56", "Device" );
	var t2 = new Timeline("xyz456", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/xyz456/state", "dev56", "Device");
	t3 = new Timeline("pqr345", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/pqr345/state", "rajiv_ipad", "Device");
	var device1 = new Device("dev56", "123", "rajiv_home_floor1", "/sessions/123/devices/dev56/RESP", [t1],redisClient);

	Context.getFromDataStore("rajiv_home", "rajiv_sync_session", redisClient)
		.catch((error)=>{
			console.log("unknown context search result: " + error);
		})
		.then((context)=>{


			if (context)
			{
				console.log("TEST 1: Context found");
				mycontext = context;
				console.log(context.serialise());
			}else
			{
				console.log("TEST 1: Context not found");
				console.log("TEST 1: Create and persist new Context");
						
				mycontext = new Context("rajiv_home", "rajiv_sync_session", [], redisClient);
			}
			console.log("TEST 2: mycontext persist 1 ");
			
			return mycontext.persistAsync(redisClient);		
		})
		.then((result)=>{
			console.log("TEST 2: mycontext persist result: "+ result);


			console.log("TEST 3: Add a new device");
			// var device1 = new Device("dev555", "123", "rajiv_home_floor1", "/sessions/123/devices/dev56/RESP", [t1],redisClient);
			return mycontext.addDeviceIfNotExists("rajiv_iphone", "/sessions/rajiv_sync_session/devices/rajiv_iphone/RESP");
		})
		.then((result)=>{
			console.log("TEST 3: result ", result );
			console.log("TEST 4: Add another new device");

			printContext(mycontext);

			return mycontext.addDeviceIfNotExists("rajiv_ipad", "/sessions/rajiv_sync_session/devices/rajiv_ipad/RESP");
		})
		.then((result)=>{
			console.log("TEST 4: result ", result );
			return mycontext.getDevice("rajiv_iphone");
		})
		.then((device)=>{
			if (device)
			{
				console.log("TEST 3: success , device added and persisted. ", device.serialise() );
			}else
			{
				console.log("TEST 3: Fail , device not added and persisted. ");
			}
			
			return mycontext.getDevice("rajiv_ipad");
		})
		.then((device)=>{
			if (device)
			{
				console.log("TEST 3: success , device added and persisted. ", device.serialise() );
			}else
			{
				console.log("TEST 3: Fail , device not added and persisted. ");
			}
			printContext(mycontext);

			console.log("TEST 4: Add newtimeline to device. ", device.id);
			return device.addTimeline("video1timeline","rajiv_sync_session", "http://bbc/videostream1", "urn:timeline:ct" , "/sessions/rajiv_sync_session/timelines/video1timeline/state", device.id, "Device");
		})
		.then((result)=>{
			console.log("TEST 4: Add newtimeline to device result. ", result);

			console.log("get timeline video1timeline from device ...");
			return mycontext.getDevice("rajiv_ipad");			
		}).then((device)=>{
			if (!device)
			{
				console.log("TEST 4: Fail , device not found. ");
				return Promise.resolve(null);			
			}else
			{
				return device.getTimeline("video1timeline");
			}
		})
		.then((timeline)=>{
			if(!timeline)
			{
				console.log("TEST 4: Fail , timeline not found. ");
			}else
			{
				console.log(timeline);
				printContext(mycontext);				
			}

			return mycontext.getDevice("rajiv_iphone");	
		})
		.then((device)=>{

			console.log("TEST 5: Add new timeline to ", device.id);
			return device.addTimeline("video2timeline","rajiv_sync_session", "http://bbc/videostream2", "urn:timeline:ct" , "/sessions/rajiv_sync_session/timelines/video2timeline/state", device.id, "Device");
			
		})
		.then((result)=>{
			console.log("TEST 5: Add new timeline result ", result);
			
			return mycontext.getDevice("rajiv_iphone");			
		})
		 .then((device)=>{
			console.log("TEST 5: Add new timeline result ", device.serialise());
		 	return device.getTimeline("video2timeline");
		})
		.then((timeline)=>{
		 	console.log(timeline);
		 	return mycontext.reload();
		}).catch((error)=>{
			console.log(error);
		}).then(()=>{
			printContext(mycontext);
		})
		//.then((device)=>{
		// 	return device.removeTimeline("video2timeline");
		// }).then((result)=>{
		// 	console.log( "video2timeline removed from device? " + result);
		// 	printContext(mycontext);
		// 	return  Promise.resolve(true);					
		// })
		.then(()=>{
			return mycontext.cleanUp(redisClient);
		})
		.then((result)=>{
			console.log("cleanup result ", result );
			printContext(mycontext);
		})

		.catch((error)=>{
			console.log(error);
		});


	
	
	
	

	function printContext(mycontext)
	{
		console.log("-------- MYCONTEXT Devices -----------");
		console.log("Number of devices: " + mycontext.devices.length);
		for(let d of mycontext.devices)
		{
			if (d instanceof Device){
				console.log(d.id + ": " + d.serialise());

				for(let t of d.timelines)
				{
					if (t instanceof Timeline)
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
