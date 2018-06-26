var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params, ContextRESP;

params = RESPParams().extend([
    { name: "contexts", type: "object", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name ContextRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string[]} contexts Array of URN strings identifying contexts
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
ContextRESP = function () { Message.call(this, ContextRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof ContextRESP
 * @param {string} messageString JSON representation of the message
 * @returns {ContextRESP} Message object
 */
ContextRESP.deserialise = Message.deserialise.bind(null, ContextRESP, params);
ContextRESP.type = "ContextRESP";
inherits(ContextRESP, Message);

module.exports = ContextRESP;
