var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params = RESPParams().get(),
    TimelineEndSubscriptionRESP;

/**
 * @constructor
 * @name TimelineEndSubscriptionRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineEndSubscriptionRESP = function () { Message.call(this, TimelineEndSubscriptionRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof TimelineEndSubscriptionRESP
 * @param {string} messageString JSON representation of the message
 * @returns {TimelineEndSubscriptionRESP} Message object
 */
TimelineEndSubscriptionRESP.deserialise = Message.deserialise.bind(null, TimelineEndSubscriptionRESP, params);
TimelineEndSubscriptionRESP.type = "TimelineEndSubscriptionRESP";
inherits(TimelineEndSubscriptionRESP, Message);

module.exports = TimelineEndSubscriptionRESP;
