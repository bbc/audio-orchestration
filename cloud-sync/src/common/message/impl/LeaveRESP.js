var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params = RESPParams().get(),
    LeaveRESP;

/**
 * @constructor
 * @name LeaveRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
LeaveRESP = function () { Message.call(this, LeaveRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof LeaveREQ
 * @param {string} messageString JSON representation of the message
 * @returns {LeaveREQ} Message object
 */
LeaveRESP.deserialise = Message.deserialise.bind(null, LeaveRESP, params);
LeaveRESP.type = "LeaveRESP";
inherits(LeaveRESP, Message);

module.exports = LeaveRESP;
