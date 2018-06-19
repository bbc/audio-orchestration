// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

"use strict";
var commandLineArgs = require("command-line-args");
var RedisConnection = require("./datastore/redisconnection");
var uuid = require("uuid/v4"); 
var Logger = require("./logger/logger");
var RedisSMQConfig = require("./RedisSMQConfig");
const Producer = require("redis-smq").Producer;
const Monitor = require("redis-smq").monitor;



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

console.log("TEST1");

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

var redisClient, redissmqConfig, eventProducer, queueMonitor;



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

		// logger.info("----------------------------------------------------------");
		// logger.info("Test 1: insert timeline in list ");
		// logger.info("----------------------------------------------------------");
		var queueName= "test_waitQueue";
		redissmqConfig = new RedisSMQConfig(redisService.host,redisService.port, "127.0.0.1", 4000);
	
		eventProducer = new Producer(queueName, redissmqConfig.getConfig()); 

		queueMonitor = new Monitor(redissmqConfig.getConfig());

		queueMonitor.listen(()=>{
			logger.info("Queue monitor running on port 4000");
		});

		console.log("Producer queuenName :", eventProducer.keys.keyQueueName);
		eventProducer.produceWithTTL({event: "testing123"}, 60000, (err) => {
			if (err) throw err;
			logger.debug("Dispatched  event to queue.");		    
		});

		var message = { event: "second event"};

		var payload = {
			uuid: uuid(),
			attempts: 1,
			data: message,
			time: new Date().getTime(),
			ttl: 60000,
		};

		
		console.log(payload);
		console.log(JSON.stringify(payload));

		redisClient.lpush("redis-smq-default|@1.1|test_waitqueue", JSON.stringify(payload), (err) => {
			if (err) console.log(err);
			else {
				console.log("success");
			}
		});



	}).catch(function(result){
		logger.info(result);
	});


