var EventEmitter = require("events"),
PahoMQTT = require("paho-mqtt");

var location = {hostname: "0.0.0.0", port:9001};


var onLoadFunc = function() {
	console.log("onload");


	initMQTTClient(location);  // url of mqtt server endpoint
};

window.onload = onLoadFunc;

var client;
var clientId = getRandomInt(0,100);


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

var initMQTTClient = function(location) {

  console.log(location);
  // Create a client instance
  client = new Paho.MQTT.Client(location.hostname, Number(location.port), clientId.toString());

  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;

  // connect the client
  client.connect({onSuccess:onConnect, onFailure: onConnectionFailure});

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
console.log = console_log;
console.info = console.log;
console.error = console.log;



// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe("Sessions/session1");
  message = new Paho.MQTT.Message(clientId + ": Hello");
  message.destinationName = "Sessions/session1";
  client.send(message);
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
}


module.exports = {
  sendMessage: function (msg_str) {
		message = new Paho.MQTT.Message("client" +clientId + ": " + msg_str);
	  message.destinationName = "Sessions/session1";
	  client.send(message);
		//console.log('send message');
  }
};
