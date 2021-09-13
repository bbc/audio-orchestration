var inherits = require("inherits"),
	Message = require("./Message"),
	MessageParams = require("./MessageParams"),
	params, UnexpectedDeviceExit;

params = MessageParams().extend([
	{ name: "contextId", type: "string", writable: false, optional: false},
	{ name: "deviceId", type: "string", writable: false, optional: false }
]).get();

/**
* @constructor
* @name UnexpectedDeviceExit
* @augments Message
* @param {string} sessionId Specifies the session
* @param {string} contextId
* @param {string} deviceId ID of the device that sent this message
* @param {string} [id=null] Unique identifier for this message
* @param {string} [version="0.0.1"] Version of the message API
*/
UnexpectedDeviceExit = function () { Message.call(this, UnexpectedDeviceExit.type, arguments, params); };

/**
* Transforms the message to JSON string
* @function
* @override
* @memberof UnexpectedDeviceExit
* @param {string} messageString JSON representation of the message
* @returns {UnexpectedDeviceExit} Message object
*/
UnexpectedDeviceExit.deserialise = Message.deserialise.bind(null, UnexpectedDeviceExit, params);
UnexpectedDeviceExit.type = "UnexpectedDeviceExit";
inherits(UnexpectedDeviceExit, Message);

module.exports = UnexpectedDeviceExit;
