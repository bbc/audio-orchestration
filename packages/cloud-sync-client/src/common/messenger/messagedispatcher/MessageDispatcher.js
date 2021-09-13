var WeakMap = require("weak-map"),
    PRIVATE = new WeakMap(),
    MessageDispatcher;

/**
 * @class MessageDispatcher
 * 
 * @classdesc ...
 * 
 * @example
 * var MessageFactory, MessageIdGenerator,
 *     dispatcher, message;
 * 
 * MessageFactory = require("MessageFactory");
 * MessageIdGenerator = require("MessageIdGenerator");
 * 
 * message = MessageFactory.create(
 *     "JoinREQ",
 *     "123",
 *     "abc",
 *     MessageIdGenerator.getNewId(),
 *     "0.1"
 * );
 * 
 * // Create instance
 * dispatcher = new MessageDispatcher(2000);
 * 
 * // Add handler for responses to this message
 * // Also add a handler for expired timeouts (time to response)
 * dispatcher.set(message, handleResponse, handleTimeout);
 * 
 * function handleResponse (res) {
 *     // Do something with the response
 * }
 * 
 * function handleTimeout (res) {
 *     // Do something, e.g. retry
 * }
 * 
 * // Send message ...
 * 
 * // Process message and create response
 * var response = MessageFactory.create(
 *     "JoinRESP",
 *     message.sessionId,
 *     0,
 *     "ws://wallclock.example.com:8080",
 *     "ws://sessionsynccontroller.example.com",
 *     message.id,
 *     message.version
 * );
 * 
 * // ... Receive response
 * dispatcher.call(response);
 * // --> 'handleResponse' is called
 * 
 * @constructor
 * @param {number} [reponseTimeoutMS=1000] Time in miliseconds by when a response
 *      is expected to requests
 */
MessageDispatcher = function (responseTimeoutMS) {
    var priv;
    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);
    priv.messageMap = {};
    priv.responseTimeout = responseTimeoutMS || 2000;
};

/**
 * Sets a callback for a given message. The callback is invoked, if a message 
 * with the same 'id' is passed to method 'call'. Callback can be fired multiple times.
 * 
 * @memberof MessageDispatcher
 * @param {Message} message
 * @param {function} onresponse Callback function to be called. In this function
 *      this refers to the message that invoked its call, i.e. the message that
 *      is passed to method 'call'.
 * @param {function} [onresponsetimeout] Callback function which is called if a response has not
 *      been received within timeoout.
 * @param {number} [responseTimeoutMS] Timeout in miliseconds by when a response is expected.
 *      Defaults to the value passed to the constructor.
 */
MessageDispatcher.prototype.set = function (message, onresponse, onresponsetimeout, responseTimeoutMS, once) {
    
    var priv, typeOfHandler, handleTimeout;
    priv = PRIVATE.get(this);
    
    typeOfHandler = typeof onresponse;
    if (typeOfHandler !== "function") {
        throw new Error("Expected 'onresponse' to be of type function. Saw '" + typeOfHandler + "' instead");
    }

    handleTimeout = onresponsetimeout || function () {};
    typeOfHandler = typeof handleTimeout;
    if (typeOfHandler !== "function") {
        throw new Error("Expected 'onresponsetimeout' to be of type function. Saw '" + typeOfHandler + "' instead");
    }

    priv.messageMap[message.id] = {
        onresponse: onresponse,
        onresponsetimeout: handleTimeout,
        timeout: setTimeout(handleTimeoutExpired.bind(this, message.id), responseTimeoutMS || priv.responseTimeout),
        once: once || false
    };
};

/**
 * Sets a callback for a given message. The callback is invoked, if a message 
 * with the same 'id' is passed to method 'call'. Callback is fired only once.
 * 
 * @memberof MessageDispatcher
 * @param {Message} message
 * @param {function} onresponse Callback function to be called. In this function
 *      this refers to the message that invoked its call, i.e. the message that
 *      is passed to method 'call'.
 * @param {function} [onresponsetimeout] Callback function which is called if a response has not
 *      been received within timeoout.
 * @param {number} [responseTimeoutMS] Timeout in miliseconds by when a response is expected.
 *      Defaults to the value set passed to the constructor.
 */
MessageDispatcher.prototype.setOnce = function (message, onresponse, onresponsetimeout, responseTimeoutMS) {
    var priv = PRIVATE.get(this);
    this.set(message, onresponse, onresponsetimeout || function () {}, responseTimeoutMS || priv.responseTimeoutMS, true);
}

/**
 * Invokes the call of the handler set with method 'set', if the 'id' property
 * value of the message passed to call equals the 'id' of a previousely set
 * handler.
 * 
 * @memberof MessageDispatcher
 * @param {Message} message
 * @returns {boolean} TRUE if a handler was registered for this message, else FALSE.
 */
MessageDispatcher.prototype.call = function (message) {
    var priv = PRIVATE.get(this);
    if (priv.messageMap.hasOwnProperty(message.id)) {
        priv.messageMap[message.id].onresponse(message);
        clearTimeout(priv.messageMap[message.id].timeout);
        if (priv.messageMap[message.id].once === true) {
            delete priv.messageMap[message.id];
        }
        return true;
    }
    return false;
};

function handleTimeoutExpired (messageId) {
    var priv, timeoutHandler; 
    priv = PRIVATE.get(this);
    timeoutHandler = priv.messageMap[messageId].onresponsetimeout;
    if (priv.messageMap.hasOwnProperty(messageId)) {
        delete priv.messageMap[messageId];
        timeoutHandler();
    }
}

module.exports = MessageDispatcher;