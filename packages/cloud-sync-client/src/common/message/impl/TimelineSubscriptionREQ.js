var inherits = require("inherits"),
    Message = require("Message"),
    REQParams = require("REQParams"),
    params, TimelineSubscriptionREQ;

params = REQParams().extend([
    { name: "timelineId", type: "string", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name TimelineSubscriptionREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} timelineId URN string specifying a particular timeline
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineSubscriptionREQ = function () { Message.call(this, TimelineSubscriptionREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineSubscriptionREQ
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineSubscriptionREQ} Message object
 */
TimelineSubscriptionREQ.deserialise = Message.deserialise.bind(null, TimelineSubscriptionREQ, params);
TimelineSubscriptionREQ.type = "TimelineSubscriptionREQ";
inherits(TimelineSubscriptionREQ, Message);

module.exports = TimelineSubscriptionREQ;
