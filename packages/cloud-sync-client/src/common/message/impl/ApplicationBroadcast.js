var inherits = require("inherits"),
    Message = require("./Message"),
    MessageParams = require("./MessageParams"),
    params, ApplicationBroadcast;

params = MessageParams().extend([
    { name: "deviceId", type: "string", writable: false, optional: false },
    { name: "broadcastTopic", type: "string", writable: false, optional: false },
    { name: "broadcastContent", type: "object", writable: false, optional: false },
]).get();

/**
 * @constructor
 * @name ApplicationBroadcast
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} broadcastTopic topic or type forwarded to application
 * @param {object} broadcastContent json serialisable object representing the message content
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
ApplicationBroadcast = function () { Message.call(this, ApplicationBroadcast.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof ApplicationBroadcast
 * @param {string} messageString JSON representation of the message
 * @returns {ApplicationBroadcast} Message object
 */
ApplicationBroadcast.deserialise = Message.deserialise.bind(null, ApplicationBroadcast, params);
ApplicationBroadcast.type = "ApplicationBroadcast";
inherits(ApplicationBroadcast, Message);

module.exports = ApplicationBroadcast;
