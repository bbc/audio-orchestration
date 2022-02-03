var inherits = require("inherits"),
    Message = require("./Message"),
    RESPParams = require("./RESPParams"),
    params, SyncTimelinesRESP;

params = RESPParams().extend([
    { name: "timelineInfo", type: "object", writable: false, optional: false },
]).get();

/**
 * @constructor
 * @name SyncTimelinesRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {TimelineInfo[]} timelineInfo 
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
SyncTimelinesRESP = function () { Message.call(this, SyncTimelinesRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof SyncTimelinesAvailable
 * @param {string} messageString JSON representation of the message
 * @returns {SyncTimelinesAvailable} Message object
 */
SyncTimelinesRESP.deserialise = Message.deserialise.bind(null, SyncTimelinesRESP, params);
SyncTimelinesRESP.type = "SyncTimelinesRESP";
inherits(SyncTimelinesRESP, Message);

module.exports = SyncTimelinesRESP;
