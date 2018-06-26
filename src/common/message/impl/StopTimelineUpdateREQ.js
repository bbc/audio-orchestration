var inherits = require("inherits"),
Message = require("Message"),
REQParams = require("REQParams"),
params, StopTimelineUpdateREQ;

params = REQParams().extend([
{ name: "timelineId", type: "string", writable: false, optional: false },
{ name: "timelineType", type: "string", writable: false, optional: false },
{ name: "contentId", type: "string", writable: false, optional: false }
]).get();

/**
* @constructor
* @name StopTimelineUpdateREQ
* @augments Message
* @param {string} sessionId Specifies the session
* @param {string} contextId Identfies the devices context
* @param {string} deviceId ID of the device that sent this message
* @param {string} responseChannel Receiver of this message shall send response(s) to this channel
* @param {string} timelineId Unique identifier for this timeline
* @param {string} timelineType Unique identifi for the timeline type
* @param {string} contentId Unique identifier for a piece of content
* @param {string} [id=null] Unique identifier for this message
* @param {string} [version="0.0.1"] Version of the message API
*/
StopTimelineUpdateREQ = function () { Message.call(this, StopTimelineUpdateREQ.type, arguments, params); };

/**
* Transforms the message to JSON string
* @function
* @override
* @memberof StopTimelineUpdateREQ
* @param {string} messageString JSON representation of the message
* @returns {StopTimelineUpdateREQ} Message object
*/
StopTimelineUpdateREQ.deserialise = Message.deserialise.bind(null, StopTimelineUpdateREQ, params);
StopTimelineUpdateREQ.type = "StopTimelineUpdateREQ";
inherits(StopTimelineUpdateREQ, Message);

module.exports = StopTimelineUpdateREQ;
