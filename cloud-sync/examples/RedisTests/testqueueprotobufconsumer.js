"use strict";

const redisSMQ = require("redis-smq");
const SyncEvents = require("./events/syncevents_pb");
const Consumer = redisSMQ.Consumer;
var base64js = require("base64-js");

class TestQueueConsumer extends Consumer {

	/**
     *
     * @param message
     * @param cb
     */
	consume(message, cb) {
		try {
			console.log("RECEIVED MESSAGE FROM QUEUE: ");
			console.log(message);
			// console.log("Got message to consume from : ", this.keys.keyQueueName, JSON.stringify(message));

			// var bytes = this.str2ab(message.event);
			// console.log(bytes.length);

			// or 
			// var bytes = base64js.toByteArray(message.event);

			// or

			var buf = Buffer.from(message.event, "base64");
			var bytes = this.toArrayBuffer(buf);


			var e =  proto.SyncEvent.deserializeBinary(bytes);
			var eventHeader = e.getHeader();
			var eventBody;

			// var priv = PRIVATE.get(this);
			
			switch (eventHeader.getEventtype()) {

			case proto.EventType.NEW_SYNC_TIMELINE:
				eventBody =  proto.NewSyncTLEvent.deserializeBinary(e.getBody());
				console.log("received new-timeline-added event: timelineId: %s, sync? %d ", eventBody.getTimelineid(), eventBody.getUseforsessionsync());

					
				break;
			case proto.EventType.DEL_SYNC_TIMELINE:
				eventBody =  proto.DelSyncTLEvent.deserializeBinary(e.getBody());
				console.log("received timeline-deleted event. timelineId: %s", eventBody.getTimelineid());
					
				break;
			default:
				console.log("Event type %d not handled", eventHeader.getEventtype());	
			}
		
		} catch (error) {
			console.error(error);
		}
		
		cb();
	}

	toArrayBuffer(buffer) {
		var ab = new ArrayBuffer(buffer.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
		}
		return ab;
	}
	

	ab2str(buf) {
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	}
	
	// ---------------------------------------------------------
	
	str2ab(str) {
		var buf = new ArrayBuffer(str.length); // 2 bytes for each char
		var bufView = new Uint8Array(buf);
		for (var i=0, strLen=str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return bufView;
	}
}

TestQueueConsumer.queueName = "test_waitQueue";

module.exports = TestQueueConsumer;