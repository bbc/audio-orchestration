var Messenger, MessageDispatcher, MessageFactory, MaxRequestRetryExceedError,
    WeakMap, events, inherits, PRIVATE;

WeakMap = require("weak-map");
events = require("events");
inherits = require("inherits");
MessageFactory = require("MessageFactory");
MessageDispatcher = require("./messagedispatcher/MessageDispatcher");

PRIVATE = new WeakMap();

/**
 * A message has been received. The message is not an awaited response
 * to a request sent with {@link Messenger#sendRequest}.
 * @event Messenger#message
 * @type {Message}
 */

 /**
 * A request message has been received. The message is not an awaited response
 * to a request sent with {@link Messenger#sendRequest}.
 * @event Messenger#request
 * @type {Message}
 */


/**
 * @class Messenger
 *
 * @classdesc ...
 *
 * @example <caption>Example 1.: Get an instance of Messenger</caption>
 *
 * var Messenger, MessagingAdapter,
 *     messenger, adapter;
 *
 * Messenger = require("Messenger");
 * MessagingAdapter = require("MqttMessagingAdapter");
 *
 * adapter = new MessagingAdapter("192.168.60.200", 8123, "device1");
 * messenger = new Messenger(adapter);
 *
 * @example <caption>Example 2.: Send a request message for which a response is expected</caption>
 *
 * // Assume we already have created an instance of Messenger (Example 1.)
 *
 * var MessageFactory, MessageIdGenerator,
 *     request, reqChannel, respChannel;
 *
 * MessageFactory = require("MessageFactory");
 * MessageIdGenerator = require("MessageIdGenerator");
 *
 * reqChannel = "sessions/123/REQ";
 * respChannel = "sessions/123/RESP";
 *
 * request = MessageFactory.create(
 *     "JoinREQ",
 *     "session1",
 *     "device1",
 *     respChannel,
 *     MessageIdGenerator.getNewId(),
 *     "0.0.1"
 * );
 *
 * messenger.listen(respChannel);
 * messenger.sendRequest(message, reqChannel, handleResponse, {
 *
 *     // A response is expected within 1500 miliseconds
 *     responseTimeoutMS: 1500
 *
 *     // Messenger shall retry 2 times, if a response is not received within the timeout
 *     maxRetry: 2,
 *
 *     // Call this handler after 3 failed send attemps
 *     onMaxRetryFailed: handleRetryFailed
 * });
 *
 * function handleResponse (response) {
 *     // Do something
 * }
 *
 * function handleRetryFailed (error) {
 *     // Do something, e.g. display a message to the user
 * }
 *
 * @example <caption>Example 3.: Send and receive messages, receive requests</caption>
 *
 * // Assume we already have created a message and defined a
 * // message channel (Example 2.). Also we have retrieved a
 * // Messenger instance (Example 1.)
 *
 * messenger.on("message", handleMessage);
 * messenger.on("request", handleRequest);
 * messenger.send(message, channel);
 *
 * function handleMessage (message) {
 *     // Do something with the message
 * }
 *
 * function handleRequest (request) {
 *     // Process request and send a response message to:
 *     // 'request.responseChannel'
 * }
 *
 * @constructor
 * @param {MessagingAdapter}
 */
Messenger = function (messagingAdapter) {
    PRIVATE.set(this, {
        dispatcher: new MessageDispatcher(),
        client: messagingAdapter
    });
    messagingAdapter.on("message", handleMessage.bind(this));
};

inherits(Messenger, events);


function handleMessage (message) {

    message = MessageFactory.deserialise(message);

    if (PRIVATE.get(this).dispatcher.call(message)) {
        // Passed message to response handler; no further action required
    }

    else if (message.hasOwnProperty("responseChannel")) {
        this.emit("request", message);
    }

    else {
        this.emit("message", message);
    }
}

Messenger.prototype.getClientId = function () {
    PRIVATE.get(this).client.getClientId();
};

/**
 * Sends a message to a given channel
 *
 * @param {Message} message Message object
 * @param {string} channel
 * @param {object} options send options such as delivery guarantees, retain
 * @param {number} options.qos 0 - at most once, 1 - at least once, 2 - exactly once
 * @param {boolean} options.retain retain message copy in channel for clients joining after the send.
 */
Messenger.prototype.send = function (message, channel, options) {
    PRIVATE.get(this).client.send(message.serialise(), channel, options);
};

/**
 * @callback Messenger~handleResponse
 * @param {Message} response
 */

 /**
  * @callback Messenger~onMaxRetryFailed
  * @param {Messenger~MaxRequestRetryExceedError} timeoutError
  */

/**
 * Sends a message to a given channel, expecting a response within a given time span.
 *
 * @param {Message} message Message object
 * @param {string} channel
 * @param {Messenger~handleResponse} handleResponse The callback that handles the response
 * @param {object} [options]
 * @param {number} [options.maxRetry=0] Number of attempts to resend message after response timeout expired
 * @param {number} [options.responseTimeoutMS=1000] Timeframe within a response to a message is expected
 * @param {Messenger~onMaxRetryFailed} [options.onMaxRetryFailed=no op.] Handler to be called after maxRetry requests
 *      have not been responded to within responseTimeoutMS miliseconds.
 * @param {boolean} [options.updates=false] Expect multiple responses which update there precursors
 */
Messenger.prototype.sendRequest = function (message, channel, handleResponse, options) {

    var opt;
    opt = options || {};
    opt.maxRetry = opt.maxRetry || 0;
    opt.responseTimeoutMS = opt.responseTimeoutMS || 2000;
    opt.updates = opt.updates || false;
    opt.onMaxRetryFailed = opt.onMaxRetryFailed || function () {};

    retry.call(this, message, channel, opt, 0, handleResponse);
};

function retry (message, channel, options, numRetry, handleResponse) {

    var priv, error;

    priv = PRIVATE.get(this);

    if (numRetry <= options.maxRetry) {

        priv.dispatcher.set(
            message,
            handleResponse,
            retry.bind(this, message, channel, options, ++numRetry, handleResponse),
            options.responseTimeoutMS,
            !options.updates
        );

        priv.client.send(message.serialise(), channel);
    }

    else {
        options.onMaxRetryFailed(new MaxRequestRetryExceedError(message, channel, numRetry));
    }
}

/**
 * Start listening for messages to a given channel.
 *
 * @param {string} channel
 *
 * @fires Messenger#message
 * @fires Messenger#request
 */
Messenger.prototype.listen = function (channel) {
    PRIVATE.get(this).client.listen(channel);
};

/**
 * Stop listening for messages to a given channel.
 *
 * @param {string} channel
 */
Messenger.prototype.stopListen = function (channel) {
    PRIVATE.get(this).client.stopListen(channel);
};

/**
 * Stop listening all subscribed channels.
 */
Messenger.prototype.stopListenAll = function () {
    PRIVATE.get(this).client.stopListenAll();
}

/**
 * Terminates connection of adapter.
 */
Messenger.prototype.disconnect = function () {
    PRIVATE.get(this).client.disconnect();
}

/**
 * Send a broadcast message.
 *
 * @param {string} message
 * @param {string} broadcastChannel
 */
Messenger.prototype.broadcast = function (message, channel) {
    PRIVATE.get(this).client.send(message, channel);
};


/**
 * @typedef {Error} Messenger~MaxRequestRetryExceedError
 * @property {string} name Name of the error
 * @property {string} message Human readable error message
 * @property {Message} requestMessage Original request message
 * @property {string} requestChannel Channel to which the request was send
 */
MaxRequestRetryExceedError = function (message, channel, numRetry) {
    this.name = "MaxRequestRetryExceedError";
    this.message = "Saw no response to any of " + numRetry + " requests.";
    this.requestMessage = message;
    this.requestChannel = channel;
};

inherits(MaxRequestRetryExceedError, Error);


module.exports = Messenger;
