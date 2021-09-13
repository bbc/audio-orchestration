var inherits = require("inherits"),
    Message = require("Message"),
    REQParams = require("REQParams"),
    params, TimelineEndSubscriptionREQ;

params = REQParams().extend([
    { name: "timelineId", type: "string", writable: false, optional: false }
]).get()

/**
 * @constructor
 * @name TimelineEndRegistrationREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} timelineId Unique identifier for timeline
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineEndSubscriptionREQ = function () { Message.call(this, TimelineEndSubscriptionREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineEndRegistrationREQ
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineEndRegistrationREQ} Message object
 */
TimelineEndSubscriptionREQ.deserialise = Message.deserialise.bind(null, TimelineEndSubscriptionREQ, params);
TimelineEndSubscriptionREQ.type = "TimelineEndSubscriptionREQ";
inherits(TimelineEndSubscriptionREQ, Message);

module.exports = TimelineEndSubscriptionREQ;
