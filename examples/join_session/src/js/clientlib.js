var EventEmitter = require("events"),
PahoMQTT = require("paho-mqtt"),
SynckitCloud =  require("synckit-cloud");
var clocks = require("dvbcss-clocks");
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);
var WallClockSynchroniser = require("./WallClockSynchroniser");

/*
 * Needs a file examples/join_session/config.js with content:
 * module.exports = {
 *     host: "192.168.xxx.xxx"
 * }
 */
var config = require("../../config");

//-----------------------------------------------------------
//  globals
//-----------------------------------------------------------

var Messages = SynckitCloud.Messages;
var JoinREQ = SynckitCloud.Messages.JoinREQ;
var JoinRESP = SynckitCloud.Messages.JoinRESP;


var mqttbroker = {hostname: config.host, port:9001};
var prevSessionId;
var client;
var clientId = getRandomInt(0,100);
var wcSync;
var wcService; 																			// a WallClockSynchroniser

//-----------------------------------------------------------
//  Initialisation routines
//-----------------------------------------------------------
var onLoadFunc = function() {
	// console.log("onload");
	console.log("Device Id: " +clientId);
	document.getElementById("deviceId").innerHTML = "Device Id: " +clientId;
	initMQTTClient(mqttbroker);  // url of mqtt server endpoint

	document.getElementById("error").hidden = true;
	document.getElementById("success").hidden = true;
};

window.onload = onLoadFunc;

var initMQTTClient = function(location) {

	console.log("initMQTTClient: MQTT broker " + JSON.stringify(location));
	// Create a client instance
	client = new Paho.MQTT.Client(location.hostname, Number(location.port), clientId.toString());

	// set callback handlers
	client.onConnectionLost = onConnectionLost;
	client.onMessageArrived = onMessageArrived;

	// connect the client
	client.connect({onSuccess:onConnect, onFailure: onConnectionFailure});

}

//-----------------------------------------------------------
//  Event handlers
//-----------------------------------------------------------
var colors = ['red', 'blue', 'yellow', 'green'];
var idx = 0;
wallClock.on('change', function()
{
	//console.log("wallclock time changed.");
	//'#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6)
	idx = (++idx) % 4;
	document.getElementById("wallclock").style.color = colors[idx];
	document.getElementById("dispersion").style.color = colors[idx];

});


//-----------------------------------------------------------
//  MQTT client callbacks
//-----------------------------------------------------------

// called when the client connects
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	console.log("onConnect: connected to MQTT broker.");

}

// called when the client loses its connection
function onConnectionFailure(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("onConnectionFailure:"+responseObject.errorMessage);
	}
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("onConnectionLost:"+responseObject.errorMessage);
	}
}

// called when a message arrives
function onMessageArrived(message) {
	console.log("onMessageArrived:"+message.payloadString);
	joinresp = JoinRESP.deserialise(message.payloadString);

	if ((typeof(joinresp.responseCode) !== "undefined") && (joinresp.responseCode== 0))
	{

		var wcServiceURLParts = breakURL(joinresp.wallclockUrl);
		console.log(wcServiceURLParts);

		if (wcServiceURLParts.length > 0){
			onJoinSuccess("Joined session " + joinresp.sessionId);
			wcService= {	protocol: wcServiceURLParts[0],
				host: wcServiceURLParts[1],
				port: wcServiceURLParts[2]
			};
			if (typeof wcService !== "undefined"){
				wcSync = new WallClockSynchroniser(wcService.protocol+ "://" + wcService.host, wcService.port, wallClock);
				wcSync.start();
			}
		}


	}else {
		onJoinError("Error: invalid response message received");
	}
}


function onJoinError(msg)
{
	document.getElementById("error").hidden = false;
	document.getElementById("success").hidden = true;
	document.getElementById("error").innerHTML = msg;
}

function onJoinSuccess(msg)
{
	document.getElementById("error").hidden = true;
	document.getElementById("success").hidden = false;
	document.getElementById("success").innerHTML = msg;
	console.log("wallclock synced.");

	setInterval(updateUI, 250);




}


var updateUI = function()
{
	var nowNanos = wallClock.getNanos();

	var date = new Date(nowNanos/1000000);
	// Hours part from the timestamp
	var hours = date.getHours();
	// Minutes part from the timestamp
	var minutes = "0" + date.getMinutes();
	// Seconds part from the timestamp
	var seconds = "0" + date.getSeconds();

	var milliseconds =date.getMilliseconds();


	// Will display time in 10:30:23 format
	var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + "." + milliseconds;
	document.getElementById("wallclock").innerHTML = formattedTime;
	document.getElementById("dispersion").innerHTML = wallClock.dispersionAtTime(wallClock.now()).toFixed(5);
};
//-----------------------------------------------------------
//  Utility functions
//-----------------------------------------------------------

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


/**
   * Monkey patch console.log and friends to redirect their output to an
   * on-screen div.
   */
function console_log() {
	out = "\n";
	for (var i = 0; i < arguments.length; i++) {
		if (i > 0) {
			out += " ";
		}
		if (typeof(arguments[i]) == "string") {
			out += arguments[i];
		} else {
			try {
				json = JSON.stringify(arguments[i]);
				if (json === undefined) {
					out += arguments[i];
				} else {
					out += json;
				}
			} catch (e) {
				out += arguments[i];
			}
		}
	}

	var console = document.getElementById("console");
	console.textContent += out;
	console.scrollTop = console.scrollHeight;
}


function breakURL(url){

	matches = /([a-zA-Z]+):\/\/([\-\w\.]+)(?:\:(\d{0,5}))?/.exec(url);

	foo = new Array();

	if(matches){
		for( i = 1; i < matches.length ; i++){ foo.push(matches[i]); }
	}

	return foo
}



//-----------------------------------------------------------
//  Console monkey patch
//-----------------------------------------------------------
console.log = console_log;
console.info = console.log;
console.error = console.log;



function joinSession(sessionId) {

	if ((sessionId.length==0))
	{
		onJoinError("Invalid session identifier");
		throw "Invalid session identifier";
	}

	var reqTopic = "Sessions/"+sessionId+ "/" + clientId+"/REQ";
	var respTopic = "Sessions/"+sessionId+ "/" + clientId+"/RESP";

	if ((typeof(prevSessionId)!=="undefined") && (sessionId!==prevSessionId)) {

		client.unsubscribe("Sessions/"+prevSessionId+ "/" + clientId+"/RESP");

		console.log("sendJoinREQ: Unsubscribed to destination: " + "Sessions/"+prevSessionId+ "/" + clientId+"/RESP");

	}

	if (sessionId!==prevSessionId){
		client.subscribe(respTopic);
		console.log("sendJoinREQ: Subscribed to destination: " + respTopic);
		prevSessionId=sessionId;
	}


	var joinreq = new JoinREQ(sessionId, clientId.toString(), "0.0.1");

	message = new Paho.MQTT.Message(joinreq.serialise());
	message.destinationName = reqTopic;
	client.send(message);

}

//-----------------------------------------------------------
//  Module exports
//-----------------------------------------------------------

module.exports = {
	sendJoinREQ: joinSession
};
