// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
const Timeline = require("./statev2/Timeline");
var RedisConnection = require("./datastore/redisconnection"); 
var list = require("./statev2/List");
var Logger = require("./logger/logger");
var log_level = "development"; 
var logger  = Logger.getNewInstance(log_level);

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

logger.info("host ipv4 address: "+ host_IP);

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
				logger.info("Query for service " + args.serviceName + "   failed.");
				reject(err);
			}

			else if (serviceNodes.length==0) {
				logger.info("no service registration for " + args.serviceName);
				reject(new Error("No service registration for " + args.serviceName));
			}

			else if ((typeof serviceNodes !== "undefined") && (serviceNodes.length > 0)) {
				var serviceEndpoint = { port: serviceNodes[0].ServicePort, host: serviceNodes[0].ServiceAddress};
				logger.info("Found " + args.serviceName + "  endpoint at: " + serviceNodes[0].ServiceAddress + ":" + serviceNodes[0].ServicePort);
				resolve(serviceEndpoint);
			}
		});
	});
}

var redisClient, timelines, t4;



discoverService(redisService)
	.catch(function() {
		return Promise.retry(discoverService, redisService, 10, 2000);
	})
	.then(function(result){
		redisService = result;
		redisService.host = "127.0.0.1";
		// process.env.REDISCLOUD_URL = redisService.host + ":" + redisService.port;
	
		// logger.info("Discovered Redis Service " + process.env.REDISCLOUD_URL);

		redisClient = RedisConnection("DEFAULT", redisService);
		
		redisClient.on("error", function (err) {
			logger.info("Redis connection Error : " + err);
		});
		logger.info("connected to redis.");

		if (typeof Timeline === "undefined")
			throw "error importing Timeline";

		logger.info("----------------------------------------------------------");
		logger.info("Test 1: insert timeline in list ");
		logger.info("----------------------------------------------------------");

		var t = new Timeline("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_1", "http://bbc/videostream", 
			"urn:timeline:ct", 1000,
			"/sessions/123/timelinea/MTUyMDc2MTc1OTE0OC0y/state", "dev56", "Device", true, false, 
			"urn:wallclock", {
				parentTime:1520761765519.4998, childTime:1, initialError :0.0254638570032, errorGrowthRate :0
			},
			{
				wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
			});

		timelines = new list("urn:rajiv_session_1:timelines1", redisClient, false);
		
		console.log("TEST 1");
		var hrend, hrstart = process.hrtime();
		timelines.insert(t, t.parentTLCorr.initialError).catch((error)=>{
			logger.info(error);
		}).then((res)=>{
			hrend = process.hrtime(hrstart);
			console.info("Execution time : %ds %dms", hrend[0], hrend[1]/1000000);
			logger.info(res);
			return redisClient.hgetallAsync("session:rajiv_session_1:timeline:MTUyMDc2MTc1OTE0OC0y");

		}).then((reply) => {

			// reply is null when the key is missing
			logger.info("Get timeline object from Redis: ");
			console.log(reply);

			return Timeline.getFromDataStore("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_1", redisClient);


		}).then((reply) => {
			logger.info("Get timeline object  using Timeline.getFromDataStore(): ");
			console.log(reply);
			logger.info(reply instanceof Timeline);
			var t2 = reply;

			logger.info("t.key :" + t.key + "\nt2.key: " + t2.key);
			logger.info(t.key === t2.key);
			logger.info(t.equals(t2));

			logger.info("----------------------------------------------------------");
			logger.info("Test 2: List getAll ");
			logger.info("----------------------------------------------------------");

			var correlation = {
				parentTime:1520761765519.4998, childTime:1, initialError :0.0144638570032, errorGrowthRate :0
			};
			var timestamp =  {
				wallclockTime: 1520761765519.4998, contentTime: 1, speed: 1.0
			};

			var t3 = new Timeline("xyz456", "rajiv_session_1", "http://bbc/videostream2", 
				"urn:timeline:ct", 1000,
				"/sessions/rajiv_session_1/timelinea/xyz456/state", "dev56", "Device", true, false, 
				"urn:wallclock", correlation, timestamp);
			logger.info("Insert timeline xyz456 in list ", timelines.name);
			return timelines.insert(t3, t3.parentTLCorr.initialError);
		}).then((reply) => {

			// reply is null when the key is missing
			
			console.log(reply);
			return Timeline.getFromDataStore("xyz456", "rajiv_session_1", redisClient);


		}).then((reply) => {
			logger.info("Get timeline object  using Timeline.getFromDataStore(): ");
			console.log(reply);


			return timelines.getAll(); 

		}).then((reply) => {

			logger.info("Get all timelines from list : ");
			console.log(reply);

			logger.info("----------------------------------------------------------");
			logger.info("Test 3: List has ");
			logger.info("----------------------------------------------------------");
			logger.info("Timelines list has: ", t.key);
			return timelines.has(t.key);
		}).then((reply) => {
			
			console.log(reply);

			logger.info("Timelines list has: RandomKey?");

			return timelines.has("RandomKey");

		}).then((reply) => {
			
			console.log(reply);

			logger.info("----------------------------------------------------------");
			logger.info("Test 4: List count ");
			logger.info("----------------------------------------------------------");

			return timelines.count();

		}).then((count) => {

			console.log("num items in list: ", count);	

			var correlation = {
				parentTime:1520761765519.4998, childTime:1, initialError :0.0291111, errorGrowthRate :0.2
			};
			var timestamp =  {
				wallclockTime: 1520761765519.4998, contentTime: 120.54, speed: 1.0
			};

			t4 = new Timeline("abc", "rajiv_session_1", "http://bbc/videostream3", 
				"urn:timeline:ct", 1000,
				"/sessions/rajiv_session_1/timelinea/xyz456/state", "dev56", "Device", true, false, 
				"urn:wallclock", correlation, timestamp);
			logger.info("Insert timeline abc in list ", timelines.name);
			return timelines.insert(t4, t4.parentTLCorr.initialError);

		}).then(()=>{

			return timelines.count();

		}).then((count)=>{
			console.log("1. num items in list: ", count);	
			return timelines.count();

		}).then((count) => {
			console.log("2. num items in list: ", count);	
			return timelines.count();

		}).then((count) => {
			console.log("3. num items in list: ", count);	
			return timelines.count();
			
		}).then((count) => {

			console.log("4. num items in list: ", count);	

			logger.info("----------------------------------------------------------");
			logger.info("Test 5: List del ");
			logger.info("----------------------------------------------------------");

			logger.info("Delete timeline MTUyMDc2MTc1OTE0OC0y from list ", timelines.name);

			return timelines.del(t.key, true);
			
		}).then((result)=>{
			console.log(result);

			return timelines.getAll(); 

		}).then((reply) => {

			logger.info("Get all timelines from list : ");
			console.log(reply);

			logger.info("Timelines list has: ", t.key, "?");
			return timelines.has(t.key);
		}).then((reply) => {
			
			console.log(reply);
			return Timeline.getFromDataStore("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_1", redisClient);			

		}).then((reply) => {
			logger.info("Get timeline MTUyMDc2MTc1OTE0OC0y  using Timeline.getFromDataStore(): ");
			console.log("result is null", reply === null);


			return timelines.count();

		}).then((count) => {

			console.log("num items in list: ", count);	

			logger.info("----------------------------------------------------------");
			logger.info("Test 5: List removeAll ");
			logger.info("----------------------------------------------------------");

			logger.info("Remove all timelines from list ", timelines.name);

			return timelines.removeAll(true);
			
		}).then(() => {
			return timelines.count();

		}).then((count) => {

			console.log("num items in list is zero? ", count==0);	

			return timelines.getAll(); 

		}).then((reply) => {

			logger.info("Get all timelines from list : ");
			console.log(reply);
			return Timeline.getFromDataStore(t4.id, "rajiv_session_1", redisClient);
						
		}).then((reply) => {
			logger.info("Get timeline ", t4.id, "  using Timeline.getFromDataStore(): ");

			console.log("result is null", reply === null);

			// return timelines.count();

		}).catch((error)=>{
			logger.info(error);
		});


		



		// ----------------------------------------------------------
		//	Test6 List getAllInRange
		// ----------------------------------------------------------


		// ----------------------------------------------------------
		//	Test7 List getByIndex
		// ----------------------------------------------------------



		// ----------------------------------------------------------
		//	Test8 List removeAll
		// ----------------------------------------------------------




		


		// 	return Timeline.existsInDataStore("MTUyMDc2MTc1OTE0OC0y", "rajiv_session_2", redisClient);

		// }).then((reply) => {
		// 	logger.info("timeline MTUyMDc2MTc1OTE0OC0y exists in data store: " + reply);

		// 	return Timeline.existsInDataStore("xxxx", "123", redisClient);
		// }).then((reply) => {
		// 	logger.info("timeline xxxx exists in data store: " + reply);
		// }).catch((error) =>{
		// 	logger.info(error);
		// });



		
		



		// var t3 = new Timeline("xyz456", "123", "http://bbc/videostream", "urn:timeline:ct", "/sessions/123/devices/dev56/state", "dev56", "Device");

		// logger.info("timeline t3: " + t3.toJSON());

		// t3.persistAsync(redisClient).then((result)=>{
		// 	logger.info("t3.persistAsync() returned " + result);
		// 	//logger.info(Timeline.persistOptions);

		// 	if (result){
		// 		Timeline.getFromDataStore("xyz456", "123", redisClient).then((timeline)=>{
		// 			logger.info("timeline xyz456 from datastore: " + timeline.toJSON());
		// 		}).catch((error) =>{
		// 			logger.info(error);
		// 		});
		// 	}
				

		// });



	}).catch(function(result){
		logger.info(result);
	});


