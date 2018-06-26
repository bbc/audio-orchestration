var inherits = require("inherits"),
Message = require("Message"),
MessageParams = require("MessageParams"),
params, DeviceStatus;

params = MessageParams().extend([
{ name: "deviceId", type: "string", writable: false, optional: false },
{ name: "status", type: "string", writable: false, optional: false },
{ name: "contextId", type: "string", writable: false, optional: true, default: null }

]).get();

/**
* @constructor
* @name DeviceStatus
* @augments Message
* @param {string} sessionId Specifies the session
* @param {string} deviceId ID of the device that sent this message
* @param {string} status one of these { "online", "offline", "publishing_timeline" }
* @param {string} [id=null] Unique identifier for this message
* @param {string} [version="0.0.1"] Version of the message API
* @param {string} [contextId=null]
*/
DeviceStatus = function () { Message.call(this, DeviceStatus.type, arguments, params); };

/**
* Transforms the message to JSON string
* @function
* @override
* @memberof UnexpectedDeviceExit
* @param {string} messageString JSON representation of the message
* @returns {UnexpectedDeviceExit} Message object
*/
DeviceStatus.deserialise = Message.deserialise.bind(null, DeviceStatus, params);
DeviceStatus.type = "DeviceStatus";
inherits(DeviceStatus, Message);

module.exports = DeviceStatus;
