
var  MessagingAdapter = require("../../../src/common/messagingadapter/MqttMessagingAdapter"),
	MessageFactory = require("../../../src/build/MessageFactory"),
	MessageIdGenerator = require("../../../src/common/messagedispatcher/MessageIdGenerator");

var sessionId = "123";
var deviceId = "abc";
var brokerHost = "192.168.1.106";
var brokerport = 1883;
var version = "0.0.1";


var msgEndpoint = new MessagingAdapter(brokerHost, brokerport, deviceId, sessionId);

msgEndpoint.on("connectionestablished", ()=>{
	console.log("connected.");

	// msgEndpoint.listen("mychannel");
	
	// console.log("send message");
	
	msgEndpoint.on("message", onMessageArrived.bind(this));
	
	msgEndpoint.on("response", onResponseArrived.bind(this));
	msgEndpoint.on("requesterror", onRequestError.bind(this));

	// msgEndpoint.send("test123", "mychannel");

	joinSession();



});

msgEndpoint.on("connectionfailure", ()=>{
	console.log("connection failure.");
});


msgEndpoint.on("connectionlost", ()=>{
	console.log("connectionlost.");
});

function onMessageArrived (msg) {
	console.log("Received message: " + msg);
	msg = MessageFactory.deserialise(msg);
	console.log("Received message with id:" +  msg.id);
}


function onResponseArrived (msg) {
	console.log("Received response: " + msg);
	msg = MessageFactory.deserialise(msg);
	console.log("Received response with id:" +  msg.id);
}


function onRequestError (msgId) {
	console.log("Request Error for request with id :" +  msgId);
}


function joinSession () {
    
	var joinRequest;
	joinRequest = MessageFactory.create(
		"JoinREQ",
		sessionId,
		deviceId,
		MessageIdGenerator.getNewId(),
		version
	);

	var request = joinRequest.serialise();

	var options = {retry: true, retryTimes: 5, retryDelay: 1};
	msgEndpoint.sendRequest(request, sessionId, options);
}


