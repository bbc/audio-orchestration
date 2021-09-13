var inherits = require("inherits"),
    Message = require("./Message"),
    RESPParams = require("./RESPParams"),
    params, JoinRESP;

params = RESPParams().extend([
    { name: "wallclockUrl", type: "string", writable: false, optional: false },
    { name: "sessionSyncControllerUrl", type: "string", writable: false, optional: false },
    { name: "rateLimit", type: "object", writable: false, optional: true, default: { numUpdates: 10, interval: 5 } }
]).get();

/**
 * @constructor
 * @name JoinRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} wallclockUrl URL which points to the wallclock service.
 * @param {string} sessionSyncController URL which points to the session-controller service.
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 * @param {object} [rateLimit] Limit the rate of timeline updates per time interval and timeline
 * @param {number} [rateLimit.numUpdates=10] Number of timeline updates per time interval
 * @param {number} [rateLimit.interval=5] Size of the time interval in seconds
 */
JoinRESP = function () { Message.call(this, JoinRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof JoinRESP
 * @param {string} messageString JSON representation of the message
 * @returns {JoinRESP} Message object
 */
JoinRESP.deserialise = Message.deserialise.bind(null, JoinRESP, params);
JoinRESP.type = "JoinRESP";
inherits(JoinRESP, Message);

module.exports = JoinRESP;
