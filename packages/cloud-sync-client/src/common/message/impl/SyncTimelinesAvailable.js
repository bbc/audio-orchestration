var inherits = require("inherits"),
    Message = require("./Message"),
    MessageParams = require("./MessageParams"),
	params, SyncTimelinesAvailable;

params = MessageParams().extend([
    { name: "timelineInfo", type: "object", writable: false, optional: false },
]).get();

/**
 * @constructor
 * @name SyncTimelinesAvailable
 
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {TimelineInfo[]} timelineInfo 
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
SyncTimelinesAvailable = function () { Message.call(this, SyncTimelinesAvailable.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof SyncTimelinesAvailable
 
 * @param {string} messageString JSON representation of the message
 * @returns {SyncTimelinesAvailable}
 } Message object
 */
SyncTimelinesAvailable.deserialise = Message.deserialise.bind(null, SyncTimelinesAvailable, params);
SyncTimelinesAvailable.type = "SyncTimelinesAvailable";
inherits(SyncTimelinesAvailable, Message);

module.exports = SyncTimelinesAvailable;
