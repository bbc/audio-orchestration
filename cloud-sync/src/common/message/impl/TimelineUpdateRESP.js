var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params = RESPParams().get(),
    TimelineUpdateRESP;

/**
 * @constructor
 * @name TimelineUpdateRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineUpdateRESP = function () { Message.call(this, TimelineUpdateRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineUpdateRESP
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineUpdateRESP} Message object
 */
TimelineUpdateRESP.deserialise = Message.deserialise.bind(null, TimelineUpdateRESP, params);
TimelineUpdateRESP.type = "TimelineUpdateRESP";
inherits(TimelineUpdateRESP, Message);

module.exports = TimelineUpdateRESP;
