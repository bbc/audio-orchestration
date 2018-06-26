"use strict";

const redisSMQ = require("redis-smq");

const Consumer = redisSMQ.Consumer;

class TestQueueConsumer extends Consumer {

	/**
     *
     * @param message
     * @param cb
     */
	consume(message, cb) {
		console.log("Got message to consume from : ", this.keys.keyQueueName, JSON.stringify(message));
		//  
		//  throw new Error('TEST!');
		//  
		//  cb(new Error('TEST!'));
		//  
		//  const timeout = parseInt(Math.random() * 100);
		//  setTimeout(() => {
		//      cb();
		//  }, timeout);
		cb();
	}
}

TestQueueConsumer.queueName = "test_waitQueue";

module.exports = TestQueueConsumer;