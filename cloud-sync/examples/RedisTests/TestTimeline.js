// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("./statev2/Timeline");
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

		if (typeof Timeline === "undefined")
			throw "error importing Timeline";

		var t = new Timeline("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_1", "http://bbc/videostream", 
			"urn:timeline:ct", 1000,
			"/sessions/123/timelinea/MTUyMDc2MTc1OTE0OC0y/state", "dev56", "Device", true, false, 
			"urn:wallclock", {
				parentTime:1520761765519.4998, childTime:1, initialError :0.0144638570032, errorGrowthRate :0
			},
			{
				wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
			});

		

		t.persist.call(t, redisClient);


		console.log(t.toJSON());
		// console.log(t.key);

		var res = redisClient.hgetallAsync("session:rajiv_session_1:timeline:MTUyMDc2MTc1OTE0OC0y").then((reply) => {

			// reply is null when the key is missing
			console.log(reply);
		}).catch((error)=>{
			console.log(error);
		});


		var t2;
		Timeline.getFromDataStore("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_1", redisClient).then((reply) => {
			
			console.log(reply instanceof Timeline);
			console.log(reply);

			t2 = reply;

			console.log("t.key :" + t.key + "\nt2.key: " + t2.key);

			console.log(t.key === t2.key);

			console.log(t.equals(t2));


			return Timeline.existsInDataStore("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_2", redisClient);

		}).then((reply) => {
			console.log("timeline MTUyMDc2MTc1OTE0OC0y exists in data store: " + reply);

			return Timeline.existsInDataStore("xxxx", "123", redisClient);
		}).then((reply) => {
			console.log("timeline xxxx exists in data store: " + reply);
		}).catch((error) =>{
			console.log(error);
		});



		
		



		// var t3 = new Timeline("xyz456", "123", "http://bbc/videostream", "urn:timeline:ct", "/sessions/123/devices/dev56/state", "dev56", "Device");

		// console.log("timeline t3: " + t3.toJSON());

		// t3.persistAsync(redisClient).then((result)=>{
		// 	console.log("t3.persistAsync() returned " + result);
		// 	//console.log(Timeline.persistOptions);

		// 	if (result){
		// 		Timeline.getFromDataStore("xyz456", "123", redisClient).then((timeline)=>{
		// 			console.log("timeline xyz456 from datastore: " + timeline.toJSON());
		// 		}).catch((error) =>{
		// 			console.log(error);
		// 		});
		// 	}
				

		// });



	}).catch(function(result){
		console.log(result);
	});


