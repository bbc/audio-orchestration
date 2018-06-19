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
var SyncEvents = require("./events/syncevents_pb");
var base64js = require("base64-js");


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


function sendNewSyncTLEventToQueue(eventProducer)
{
	var evhdr = new proto.Header();

	evhdr.setEventtype(proto.EventType.NEW_SYNC_TIMELINE);
	evhdr.setSessionid("abc");
	evhdr.setSenderid("some_device_id_lets_have_a_long_string");
	evhdr.setVersion("1.0");
	evhdr.setEventid("10");


	var evBody= new proto.NewSyncTLEvent();
	evBody.setProviderid("some_device_id_lets_have_a_long_string");
	evBody.setTimelineid("some_timeline_id_lets_have_a_veeeeeeerrrrrrrrryyyyyyyyyyyyyyyyyyy_long_string");
	evBody.setTimelinetype("some_device_type_lets_have_a_long_string");
	evBody.setContentid("http://192.168.1.106/videos/camera1.mp4");
	evBody.setFrequency(1000);
	evBody.setChannel("urn:timeline:some_timeline_id_lets_have_a_long_string");
	evBody.setUseforsessionsync(true);
	evBody.setWritable(true);

	var timestamp = new proto.PresentationTimestamp();
	timestamp.setContenttime(1001);
	timestamp.setWallclocktime(1002);
	timestamp.setSpeed(1.0123);
	timestamp.setDispersion(0.0);
	
	evBody.setTimestamp(timestamp);

	var evBodyBytes = evBody.serializeBinary();

	var event = new proto.SyncEvent();
	event.setHeader(evhdr);
	event.setBody(evBodyBytes); 
	var eventBytes = event.serializeBinary();

	var buf = Buffer.from(eventBytes);
	var eventBytesB64 = buf.toString("base64");



	// var eventBytesB64 = base64js.fromByteArray(eventBytes);
	
	// var eventBytesString =  ab2str(eventBytes);
	// console.log("Event bytes as string using UTF-16 conversion: ");
	// console.log(eventBytesString);

	console.log("Event bytes as string using B64 conversion: ");
	console.log(eventBytesB64);

	eventProducer.produceWithTTL({event: eventBytesB64}, 60000, (err) => {
		if (err) throw err;
		logger.debug("Dispatched  NewSyncTL event to test queue.");		    
	});

}


function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return bufView;
}

var redisClient, redissmqConfig, eventProducer, queueMonitor;



discoverService(redisService)
	.catch(function() {
		return Promise.retry(discoverService, redisService, 10, 2000);
	})
	.then(function(result){
		redisService = result;
		redisService.host = "127.0.0.1";

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

		console.log("Producer queueName :", eventProducer.keys.keyQueueName);


		sendNewSyncTLEventToQueue(eventProducer);


		



	}).catch(function(result){
		logger.info(result);
	});


