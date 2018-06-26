// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("../../src/service/state/Timeline");
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
		
		var t = new Timeline("abc1234", "123", "http://bbc/videostream", "urn:timeline:ct", "/sessions/123/devices/dev56/state", "dev56", "Device" );

		console.log(t.toJSON());

		t.persist(redisClient);

		var res = redisClient.getAsync(t.key).then((reply) => {
			// reply is null when the key is missing
			console.log(reply);
		});


		var t2;
		Timeline.getFromDataStore("abc1234", "123", redisClient).then((reply) => {
			
			console.log(reply instanceof Timeline);
			console.log(reply.toJSON());

			t2 = reply;

			console.log("t.key :" + t.key + "\nt2.key: " + t2.key);

			console.log(t.key === t2.key);

			console.log(t.equals(t2));

		}).catch((error) =>{
			console.log(error);
		});


		Timeline.existsInDataStore("xxxx", "123", redisClient).then((reply) => {
			console.log("timeline abc1234 exists in data store: " + reply);
		}).catch((error) =>{
			console.log(error);
		});
		//console.log(Timeline.persistOptions);

		Timeline.existsInDataStore("abc1234", "123").then((reply) => {
			console.log("timeline abc1234 exists in data store: " + reply);
		}).catch((error) =>{
			console.log(error);
		});



		var t3 = new Timeline("xyz456", "123", "http://bbc/videostream", "urn:timeline:ct", "/sessions/123/devices/dev56/state", "dev56", "Device");

		console.log("timeline t3: " + t3.toJSON());

		t3.persistAsync(redisClient).then((result)=>{
			console.log("t3.persistAsync() returned " + result);
			//console.log(Timeline.persistOptions);

			if (result){
				Timeline.getFromDataStore("xyz456", "123", redisClient).then((timeline)=>{
					console.log("timeline xyz456 from datastore: " + timeline.toJSON());
				}).catch((error) =>{
					console.log(error);
				});
			}
				

		});



	}).catch(function(result){
		console.log(result);
	});


