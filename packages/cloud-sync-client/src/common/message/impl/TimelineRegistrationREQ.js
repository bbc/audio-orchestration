var inherits = require("inherits"),
    Message = require("./Message"),
    REQParams = require("./REQParams"),
    params, TimelineRegistrationREQ;

params = REQParams().extend([
    { name: "correlation", type: "object", writable: false, optional: false },
    { name: "timelineId", type: "string", writable: false, optional: false },
    { name: "contentId", type: "string", writable: false, optional: false },
    { name: "timelineType", type: "string", writable: false, optional: false },
    { name: "frequency", type: "number", writable: false, optional: false },
    { name: "channel", type: "string", writable: false, optional: false },
    { name: "useForSessionSync", type: "boolean", writable: false, optional: false },
    { name: "writable", type: "boolean", writable: false, optional: false }
]).get();

/**
 * @typedef {object} Correlation
 * @property {number} parentTime Time on the reference clock
 * @property {number} childTime Time on this clock
 * @property {number} initialError Intitial time error
 * @property {number} errorGrowthRate Error groth rate
 */

/**
 * @constructor
 * @name TimelineRegistrationREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} contextId Identfies the devices context
 * @param {Correlation} correlation ...
 * @param {string} timelineId URN string identifying a particular timeline
 * @param {string} contentId Unique identifier for a piece of content
 * @param {string} timelineType URN string specifying the timeline type
 * @param {number} frequency Number of ticks per second on this timeline
 * @param {string} channel address for the channel to listen to for updates to this timeline
 * @param {boolean} useForSessionSync this timeline shall be considered for synchronising the whole session by the sync controller
 * @param {boolean} writable this timeline can be changed by an external party (e.g. sync controller):
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineRegistrationREQ = function () { Message.call(this, TimelineRegistrationREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineRegistrationREQ
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineRegistrationREQ} Message object
 */
TimelineRegistrationREQ.deserialise = Message.deserialise.bind(null, TimelineRegistrationREQ, params);
TimelineRegistrationREQ.type = "TimelineRegistrationREQ";
inherits(TimelineRegistrationREQ, Message);

module.exports = TimelineRegistrationREQ;
