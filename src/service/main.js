// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

var EventEmitter = require("events");
var netutils = require("./netutils");
var commandLineArgs = require("command-line-args");

var MessageFactory = require("../../build/lib/MessageFactory");
var Messenger = require("../../build/lib/Messenger");
var MessagingAdapter = require("../../src/common/messenger/messagingadapter/MqttMessagingAdapter");

var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);

var RedisConnection = require("./datastore/redisconnection"); 


const Timeline = require("./state/Timeline");
const Device = require("./state/Device");
const Context = require("./state/Context");
const Session = require("./state/Session");


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
//  command-line-args config
// ---------------------------------------------------------

var optionDefinitions = [
	{ name: "keepalive", alias: "k", type: Number, defaultValue: 10000 },
	{ name: "sessionid", alias: "s", type: String },
	{ name: "ip", alias: "i", type: String },
];

var options = commandLineArgs(optionDefinitions);
if ((typeof(options.sessionid) === "undefined")) {
	throw("Error - sessionid parameter missing.");
}
var sessionId = options.sessionid;
host_IP = options.ip;





// ---------------------------------------------------------
//  discover services and connect to mqtt broker service
// ---------------------------------------------------------
var host_IP;
var client;
var wallclockservice_udp = { serviceName: "wallclockservice-6677"};
var wallclockservice_ws = { serviceName: "wallclockservice-6676"};
var mosquitto = { serviceName: "mosquitto-1883"};
var redis = { serviceName: "redis"};
var redisClient;
var mysession;
const kDefaultContextId = "default_context";

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
		return Promise.retry(discoverService, mosquitto, 10, 2000);
	})	
	.then(function (result) {
		redis = result;
		console.log("Discovered Redis Service:", JSON.stringify(redis));
		setupSessionController();
	});


// ---------------------------------------------------------

function setupSessionController() {

	var adapter;
	
	// set up connection to Redis datastore
	//process.env.REDISCLOUD_URL = redis.host + ":" + redis.port;
	
	console.log("connecting to Redis endpoint " + JSON.stringify(redis));
	redisClient = RedisConnection("DEFAULT", redis);

	redisClient.on("error", function (err) {
		console.log("Redis connection Error : " + err);
	});
	console.log("connected to redis.");

	// setup session state with default context
	var default_context = new Context("default_context", sessionId, [], redisClient);
	mysession = new Session(sessionId, [default_context], redisClient, "Sync Demo Session");

	mysession.persistAsync(redisClient).then((result)=>{
		console.log("Session state saved to Redis: " + result);
		// set up messaging channel
		adapter = new MessagingAdapter(mosquitto.host, mosquitto.port, "SyncService");
		adapter.on("connectionestablished", handleAdapterConnected.bind(null, mosquitto));
		adapter.on("connectionfailure", handleAdapterConnectionFailure);

		client = new Messenger(adapter);
		client.on("request", handleIncommingRequest);

		console.log("Listening to requests ....");
	});
	
	



}

function handleAdapterConnected (serviceEndpoint) {
	var topic = "Sessions/" + sessionId + "/REQ";
	client.listen(topic);
	console.log("Connected to mqtt broker:", serviceEndpoint.host + ":" + serviceEndpoint.port);
	console.log("Subscribed to topic:", topic);
}

function handleAdapterConnectionFailure (error) {
	console.error(error);
}

function handleIncommingRequest (request) {

	console.log("Received", request.type,"request:", request.serialise());

	switch (request.type) {
	case "JoinREQ":
		handleJoinREQ(request);
		break;
	case "LeaveREQ":
		handleLeaveREQ(request);
		break;
	case "DeviceREQ":
		handleDeviceREQ(request);
		break;
	case "ContextREQ":
		handleContextREQ(request);
		break;
	default:
		console.log("No handler for", request.type,"request");
	}
}

function handleJoinREQ(request) {

	// check if context in request message exists, if not create a new context
	if (typeof request.contextId === "undefined")
		request.contextId = kDefaultContextId;

	mysession.getContext(request.contextId)
		.then((context)=>{
			if (!context)
			{
				var new_ctx = new Context(request.contextId, mysession.id, redisClient);
				mysession.contexts.push(new_ctx);
				context = new_ctx;
			}	

			// add device to context
			return mysession.addDeviceToContext(request.deviceId, request.responseChannel, context.id);

		}).then((device)=>{
			// print device object returned from addDeviceToContext()
			if (device){
				console.log("Device added: " + device.serialise());
			}

			return getSessionInfo(request);
		})
		.then(sendJoinResponse.bind(null, request, 0 /* OKAY */))
		.catch(sendJoinResponse.bind(null, request, 1 /* Processing Error */));


}

function handleLeaveREQ(request) {
	
	// check if context in request message exists, if not create a new context
	if (typeof request.contextId === "undefined")
		request.contextId = kDefaultContextId;
	
	mysession.getContext(request.contextId)
		.then((context)=>{
			
			if(context)
				// add device to context
				return mysession.removeDevice(request.deviceId);
			else
				sendLeaveResponse.bind(null, request, 1 /* Processing Error */);
		}).then((result)=>{
			// print device object returned from addDeviceToContext()
			if (result){
				sendLeaveResponse.bind(null, request, 0 /* OKAY */);
			}else{
				sendLeaveResponse.bind(null, request, 1 /* Processing Error */);
			}	
			
		}).catch(sendLeaveResponse.bind(null, request, 1 /* Processing Error */));
	
	
}

function handleDeviceREQ (request) {
	
	getDevices(request)
		.then((devices)=>{
			//console.log("xxxxxxxxxxxxxxxxxxxxx");
			var flattened = [].concat.apply([],devices);
			// console.log(flattened);			
			sendDeviceResponse(request, 0, flattened);
		})
		.catch(sendDeviceResponse.bind(null, request, 1));
}

function handleContextREQ (request) {
	getContexts(request)
		.then(sendContextResponse.bind(null, request, 0))
		.catch(sendContextResponse.bind(null, request, 1));
}


function getSessionInfo (request) {
	return new Promise(function (resolve, reject) {
		// Create mock endpoints
		// TODO Replace mock code by DB query
		var wallclockUrl, sessionControllerUrl;
		wallclockUrl = "ws://" + wallclockservice_ws.host + ":" + wallclockservice_ws.port;
		sessionControllerUrl = "ws://sessionsynccontroller.example.com";
		resolve({
			wallclockUrl: wallclockUrl,
			sessionControllerUrl: sessionControllerUrl
		});
	});
}

function sendJoinResponse (request, responseCode, sessionInfo) {
	
	var sesInfo = sessionInfo || {};
	
	let response = MessageFactory.create(
		"JoinRESP",
		request.sessionId,
		responseCode,
		sesInfo.wallclockUrl || null,
		sesInfo.sessionControllerUrl || null,
		request.id,
		request.version
	).serialise();

	console.log("Sent JoinREQ response: ", response);
	client.send(response, request.responseChannel);
}


function sendLeaveResponse (request, responseCode) {
		
	let response = MessageFactory.create(
		"LeaveRESP",
		request.sessionId,
		responseCode,
		request.id,
		request.version
	).serialise();

	console.log("Sent LeaveREQ response: ", response);
	client.send(response, request.responseChannel);
}


function getDevices (request) {
	
	var promises = [];
	for ( let ctx of mysession.contexts)
	{
		console.log(ctx.id);
		var p = ctx.getMyDevicesFromDataStore(redisClient);
		promises.push(p);
	}
	return Promise.all(promises);
}

function sendDeviceResponse (request, responseCode, devices) {
	
	var response = MessageFactory.create(
		"DeviceRESP",
		request.sessionId,
		responseCode,
		devices || [],
		request.id,
		request.version
	).serialise();
	
	console.log("Sent DeviceREQ response: ", response);
	client.send(response, request.responseChannel);
}


function getContexts (request) {
	return new Promise(function (resolve, reject) {
		// Return mock contexts
		// TODO Replace mock code by DB query
		var contexts = Array.from(mysession.contexts);
		resolve(contexts);
	});
}

function sendContextResponse (request, responseCode, contexts) {

	
	var contextIds = [];
	
	for (let c of contexts)
	{
		if (c instanceof Context)  contextIds.push(c.id);
		else if (typeof c === "string") contextIds.push(c);
	}
	
	var response = MessageFactory.create(
		"ContextRESP",
		request.sessionId,
		0,
		contextIds || [],
		request.id,
		request.version
	).serialise();

	console.log("Sent ContextREQ response: ", response);
	client.send(response, request.responseChannel);
}


function printError (err) {
	if (typeof err !== "undefined") {
		console.error(err)
	};
}

// Creates uniques device ID
// source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4 () {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}