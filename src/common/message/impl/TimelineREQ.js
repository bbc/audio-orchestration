var inherits = require("inherits"),
    Message = require("Message"),
    REQParams = require("REQParams"),
    params, TimelineREQ;

params = REQParams().extend([
    { name: "providerContextId", type: "string", writable: false, optional: true, default: null },
    { name: "providerId", type: "string", writable: false, optional: true, default: null },
    { name: "timelineType", type: "string", writable: false, optional: true, default: null },
    { name: "contentId", type: "string", writable: false, optional: true, default: null },
    { name: "syncTimeline", type: "boolean", writable: false, optional: true, default: false }
]).get();

/**
 * @constructor
 * @name TimelineREQ
 * @augments Message
 * @param {string} sessionId Identifies the sender's session
 * @param {string} contextId Identfies the sender's context
 * @param {string} deviceId Identifies the sender of this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 * @param {string} [providerContextId=null] Identifier of the context of the provider of a timeline 
 * @param {string} [providerId=null] Identifier of the provider of a timeline, e.g. identifier of a device in the session
 * @param {string} [timelineType=null] URN string specifying the timeline type
 * @param {string} [contentId=null] Unique identifier for a piece of content
 * @param {boolean} [syncTimeline=false] Idicates, if querying session-sync timelines only
 */
TimelineREQ = function () { Message.call(this, TimelineREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineREQ
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineREQ} Message object
 */
TimelineREQ.deserialise = Message.deserialise.bind(null, TimelineREQ, params);
TimelineREQ.type = "TimelineREQ";
inherits(TimelineREQ, Message);

module.exports = TimelineREQ;
