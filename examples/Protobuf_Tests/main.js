var MyMessage = require("./testmessage_pb");
var SyncEvents = require("./syncevents_pb");

var message = new proto.TestMessage();
message.setSometext("Hello Protocol Buffers");
console.log(message.getSometext());


var timestamp = new proto.PresentationTimestamp();

timestamp.setContenttime(123.45);
console.log(timestamp.getContenttime());


var evhdr = new proto.Header();
evhdr.setEventtype(proto.EventType.NEW_SYNC_TIMELINE);
evhdr.setSessionid("mysession-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
evhdr.setSenderid("sender-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
evhdr.setVersion("1.0");
evhdr.setEventid("cccccccccccccccccccccccccccccccccccccccccccc");




var body= new proto.NewSyncTLEvent();
body.setProviderid("rajiv_iphonesdddddddddddddddddddddddddddddddddd");
body.setTimelineid("feeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeef");
body.setTimelinetype("urn:timeline:type:1000");
body.setContentid("video1.mp4");
body.setFrequency(1000);
body.setChannel("mychannel");
body.setUseforsessionsync(true);
body.setWritable(true);

var bodybytes = body.serializeBinary();

var event = new proto.SyncEvent();
event.setHeader(evhdr);
event.setBody(bodybytes); 


var eventBytes = event.serializeBinary();

console.log(eventBytes.length);
console.log(eventBytes.toString());

var ev2 =  proto.SyncEvent.deserializeBinary(eventBytes);

if (ev2.getHeader().getEventtype() === proto.EventType.NEW_SYNC_TIMELINE)
{
	var newTlEvent =  proto.NewSyncTLEvent.deserializeBinary(ev2.getBody());

	console.log(newTlEvent.getProviderid());
	console.log(newTlEvent.getUseforsessionsync());
}

// --------------------------------------------------------------------
console.log("-------------------------------------------------");

console.log("Converting event bytes to string:");
var eventBytesString =  ab2str(eventBytes);
console.log(eventBytesString);

console.log("Converting string back to Uint8Array:");
var bytes = str2ab(eventBytesString);
console.log(bytes.length);
try {
	console.log("BEFORE DESERIALIZE");
	var ev3 =  proto.SyncEvent.deserializeBinary(bytes);
	console.log("AFTER DESERIALIZE");
	console.log(ev3.getHeader().getEventtype());
	if (ev3.getHeader().getEventtype() === proto.EventType.NEW_SYNC_TIMELINE)
	{
		var newTlEvent =  proto.NewSyncTLEvent.deserializeBinary(ev3.getBody());

		console.log(newTlEvent.getProviderid());
		console.log(newTlEvent.getUseforsessionsync());
		console.log(newTlEvent.getTimelineid());
	}


} catch (error) {
	console.log(error);
}


console.log("-------------------------------------------------");

// --------------------------------------------------------------------

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




