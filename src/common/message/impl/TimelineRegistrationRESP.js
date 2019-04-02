var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params,
    TimelineRegistrationRESP;

params = RESPParams().extend([
    { name: "timelineUpdateChannel", type: "string", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name TimelineRegistrationRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} timelineUpdateChannel
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineRegistrationRESP = function () { Message.call(this, TimelineRegistrationRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineRegistrationRESP
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineRegistrationRESP} Message object
 */
TimelineRegistrationRESP.deserialise = Message.deserialise.bind(null, TimelineRegistrationRESP, params);
TimelineRegistrationRESP.type = "TimelineRegistrationRESP";
inherits(TimelineRegistrationRESP, Message);

module.exports = TimelineRegistrationRESP;
