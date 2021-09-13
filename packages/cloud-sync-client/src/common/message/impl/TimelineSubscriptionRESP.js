var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params, TimelineSubscriptionRESP;

params = RESPParams().extend([
    { name: "providerChannel", type: "string", writable: false, optional: false },
    { name: "presentationTimestamp", type: "object", writable: false, optional: true, default: null }
]).get();

/**
 * @typedef {object} PresentationTimestamp
 * @property {Timestamp} earliest
 * @property {Timestamp} actual
 * @property {Timestamp} latest
 */

/**
 * @typedef {object} Timestamp
 * @property {number} contentTime
 * @property {number} wallclockTime
 * @property {number} speed
 */

/**
 * @constructor
 * @name TimelineSubscriptionRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} providerChannel MQTT topic to register to for timeline updates
 * @param {PresentationTimestamp} [presentationTimestamp=null] if available
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
TimelineSubscriptionRESP = function () { Message.call(this, TimelineSubscriptionRESP.type, arguments, params); };
TimelineSubscriptionRESP.deserialise = Message.deserialise.bind(null, TimelineSubscriptionRESP, params);
TimelineSubscriptionRESP.type = "TimelineSubscriptionRESP";
inherits(TimelineSubscriptionRESP, Message);

module.exports = TimelineSubscriptionRESP;
