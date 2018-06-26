var inherits = require("inherits"),
    Message = require("Message"),
    REQParams = require("REQParams"),
    params = REQParams().get(),
    DeviceREQ;

/**
 * @constructor
 * @name DeviceREQ
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
DeviceREQ = function () { Message.call(this, DeviceREQ.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof DeviceREQ
 * @param {string} messageString JSON representation of the message
 * @returns {DeviceREQ} Message object
 */
DeviceREQ.deserialise = Message.deserialise.bind(null, DeviceREQ, params);
DeviceREQ.type = "DeviceREQ";
inherits(DeviceREQ, Message);

module.exports = DeviceREQ;
