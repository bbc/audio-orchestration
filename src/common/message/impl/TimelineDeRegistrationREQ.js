var inherits = require("inherits"),
    Message = require("Message"),
    REQParams = require("REQParams"),
    params, TimelineDeRegistrationREQ;

params = REQParams().extend([
    { name: "timelineId", type: "string", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name TimelineDeRegistrationREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} timelineId Unique identifier for timeline
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineDeRegistrationREQ = function () { Message.call(this, TimelineDeRegistrationREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineDeRegistrationREQ
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineDeRegistrationREQ} Message object
 */
TimelineDeRegistrationREQ.deserialise = Message.deserialise.bind(null, TimelineDeRegistrationREQ, params);
TimelineDeRegistrationREQ.type = "TimelineDeRegistrationREQ";
inherits(TimelineDeRegistrationREQ, Message);

module.exports = TimelineDeRegistrationREQ;
