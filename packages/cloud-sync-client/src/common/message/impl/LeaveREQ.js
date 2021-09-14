var inherits = require("inherits"),
    Message = require("./Message"),
    REQParams = require("./REQParams"),
    params = REQParams().get(),
    LeaveREQ;

/**
 * @constructor
 * @name LeaveREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
LeaveREQ = function () { Message.call(this, LeaveREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof LeaveREQ
 * @param {string} messageString JSON representation of the message
 * @returns {LeaveREQ} Message object
 */
LeaveREQ.deserialise = Message.deserialise.bind(null, LeaveREQ, params);
LeaveREQ.type = "LeaveREQ";
inherits(LeaveREQ, Message);

module.exports = LeaveREQ;
