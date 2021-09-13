var inherits = require("inherits"),
    Message = require("Message"),
    RESPParams = require("RESPParams"),
    params, DeviceRESP;

params = RESPParams().extend([
    { name: "devices", type: "object", writable: false, optional: false }
]).get();

/**
 * @constructor
 * @name DeviceRESP
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string[]} devices Array of URN strings identifying devices
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
DeviceRESP = function () { Message.call(this, DeviceRESP.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof DeviceRESP
 * @param {string} messageString JSON representation of the message
 * @returns {DeviceRESP} Message object
 */
DeviceRESP.deserialise = Message.deserialise.bind(null, DeviceRESP, params);
DeviceRESP.type = "DeviceRESP";
inherits(DeviceRESP, Message);

module.exports = DeviceRESP;
