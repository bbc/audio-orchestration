var inherits = require("inherits"),
    Message = require("./Message"),
    MessageParams = require("./MessageParams"),
    params, TimelineQuery;

params = MessageParams().extend([
    { name: "contentId", type: "string", writable: false, optional: true, default: "*" },
    { name: "timelineType", type: "string", writable: false, optional: true, default: "*" }
]).get();

/**
 * @constructor
 * @name TimelineQuery
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contentId Unique identifier for a piece of content
 * @param {string} timelineType URN string identifying a particular timeline type
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineQuery = function () { Message.call(this, TimelineQuery.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineQuery
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineQuery} Message object
 */
TimelineQuery.deserialise = Message.deserialise.bind(null, TimelineQuery, params);
TimelineQuery.type = "TimelineQuery";
inherits(TimelineQuery, Message);

module.exports = TimelineQuery;
