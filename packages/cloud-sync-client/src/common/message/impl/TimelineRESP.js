var inherits = require("inherits"),
    Message = require("./Message"),
    RESPParams = require("./RESPParams"),
    params, TimelineRESP;

params = RESPParams().extend([
    { name: "timelineInfo", type: "object", writable: false, optional: false },
]).get();

/**
 * @constructor
 * @name TimelineRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {TimelineInfo[]} timelineInfo 
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineRESP = function () { Message.call(this, TimelineRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineRESP
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineRESP} Message object
 */
TimelineRESP.deserialise = Message.deserialise.bind(null, TimelineRESP, params);
TimelineRESP.type = "TimelineRESP";
inherits(TimelineRESP, Message);

module.exports = TimelineRESP;
