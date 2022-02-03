var inherits = require("inherits"),
    Message = require("./Message"),
    RESPParams = require("./RESPParams"),
    params = RESPParams().get(),
    TimelineDeRegistrationRESP;

/**
 * @constructor
 * @name TimelineDeRegistrationRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineDeRegistrationRESP = function () { Message.call(this, TimelineDeRegistrationRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineDeRegistrationRESP
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineDeRegistrationRESP} Message object
 */
TimelineDeRegistrationRESP.deserialise = Message.deserialise.bind(null, TimelineDeRegistrationRESP, params);
TimelineDeRegistrationRESP.type = "TimelineDeRegistrationRESP";
inherits(TimelineDeRegistrationRESP, Message);

module.exports = TimelineDeRegistrationRESP;
