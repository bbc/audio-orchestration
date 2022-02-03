var inherits = require("inherits"),
    Message = require("./Message"),
    REQParams = require("./REQParams"),
    params = REQParams().get(),
    ContextREQ;

/**
 * @constructor
 * @name ContextREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
ContextREQ = function () { Message.call(this, ContextREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof ContextREQ
 * @param {string} messageString JSON representation of the message
 * @returns {ContextREQ} Message object
 */
ContextREQ.deserialise = Message.deserialise.bind(null, ContextREQ, params);
ContextREQ.type = "ContextREQ";
inherits(ContextREQ, Message);

module.exports = ContextREQ;
