var inherits = require("inherits"),
    Message = require("./Message"),
    MessageParams = require("./MessageParams"),
    params, TimelineUpdate;

params = MessageParams().extend([
    { name: "deviceId", type: "string", writable: false, optional: false },
    { name: "timelineId", type: "string", writable: false, optional: false },
    { name: "timelineType", type: "string", writable: false, optional: false },
    { name: "contentId", type: "string", writable: false, optional: false },
    { name: "presentationTimestamp", type: "object", writable: false, optional: false },
    { name: "dispersionAt", type: "object", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name TimelineUpdate
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} timelineId
 * @param {string} timelineType
 * @param {string} contentId
 * @param {PresentationTimestamp} presentationTimestamp ...
 * @param {object} dispersionAt Dispersion of timeline clock for a specific point on on the timeline
 * @param {number} dispersionAt.dispersionS Dispersion in seconds
 * @param {number} dispersionAt.timeS Time on timeline in seconds
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineUpdate = function () { Message.call(this, TimelineUpdate.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineUpdate
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineUpdate} Message object
 */
TimelineUpdate.deserialise = Message.deserialise.bind(null, TimelineUpdate, params);
TimelineUpdate.type = "TimelineUpdate";
inherits(TimelineUpdate, Message);

module.exports = TimelineUpdate;
