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


// ---------------------------------------------------------
//  discover and connect to Redis
// ---------------------------------------------------------

var redisClient;

discoverService(redisService)
	.catch(function(result) {
		return Promise.retry(discoverService, redisService, 10, 2000);
	})
	.then(function(result){
		redisService = result;
	
		process.env.REDISCLOUD_URL = redisService.host + ":" + redisService.port;
	
		console.log("Discovered Redis Service " + process.env.REDISCLOUD_URL);


		redisClient = RedisConnection();
		redisClient.on("error", function (err) {
			console.log("Error " + err);
		});

		if (typeof Timeline === "undefined")
			throw "error importing Timeline";
		
		if (typeof Device === "undefined")
			throw new Error("error importing Device");
		
			
		var t1 = new Timeline("abc1234", "123", "http://bbc/videostream1", "urn:timeline:ct", "/sessions/123/timelines/abc1234/state", "dev56", "Device" );
		var t2 = new Timeline("xyz456", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/xyz456/state", "dev56", "Device");
		

		var mydevice = new Device("dev56", "123", "floor1", "/sessions/123/devices/dev56/RESP", [t1], redisClient);

		// mydevice.timelines[0].then((item)=>{
		// 	console.log(item);
		// });

		mydevice.timelines[1] = t2;
		// mydevice.timelines[1].then((item)=>{
		// 	console.log(item);
		// });

		mydevice.timelines.push("abc1234");
		mydevice.timelines[2].then((item)=>{

			console.log(item);
			for(let p of mydevice.timelines)
			{
				console.log("TEST FOR ONE");
				console.log(p);
			}
		});

		
		mydevice.timelines[3] = "sdfsf";

		// var promise = mydevice.timelines[3];
		// promise.then((item)=>{
		// 	console.log(item);
		// });


		console.log("TEST PUSH");
		var t3 = new Timeline("pqr345", "123", "http://bbc/videostream2", "urn:timeline:ct", "/sessions/123/timelines/pqr345/state", "dev56", "Device");
		mydevice.timelines.push(t3);
		mydevice.timelines[4].then((item)=>{
			console.log(item);
			for(let p of mydevice.timelines)
			{
				console.log("TEST FOR TWO");
				console.log(p);
			}
		});


		// var t4 = mydevice.timelines.pop();
		// console.log("t4 is a timeline object: "+ (t4 instanceof Timeline));
		// console.log("t4 is a timeline object: "+ t4.serialise());
		// console.log("TEST FOR");
		// for(let p of mydevice.timelines)
		// {
		// 	console.log(p);
		// }

	}).catch(function(result){
		console.log(result);
	});


