var inherits = require("inherits"),
    Message = require("./Message"),
    REQParams = require("./REQParams"),
    params,
    JoinREQ;

params = REQParams().extend([
    { name: "requestChannel", type: "string", writable: false, optional: false },
    { name: "syncTLStrategy", type: "number", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name JoinREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} requestChannel Receiver of this message shall send requests to this channel
 * @param {number} syncTLStrategy
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
JoinREQ = function () { Message.call(this, JoinREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof JoinREQ
 * @param {string} messageString JSON representation of the message
 * @returns {JoinREQ} Message object
 */
JoinREQ.deserialise = Message.deserialise.bind(null, JoinREQ, params);
JoinREQ.type = "JoinREQ";
inherits(JoinREQ, Message);

module.exports = JoinREQ;
