var inherits = require("inherits"),
Message = require("./Message"),
REQParams = require("./REQParams"),
params = REQParams().get(),
PingREQ;

/**
* @constructor
* @name PingREQ
* @augments Message
* @param {string} sessionId Specifies the session
* @param {string} contextId Identfies the devices context
* @param {string} deviceId ID of the device that sent this message
* @param {string} responseChannel Receiver of this message shall send response(s) to this channel
* @param {string} [id=null] Unique identifier for this message
* @param {string} [version="0.0.1"] Version of the message API
*/
PingREQ = function () { Message.call(this, PingREQ.type, arguments, params); };

/**
* Transforms the message to JSON string
* @function
* @override
* @memberof PingREQ
* @param {string} messageString JSON representation of the message
* @returns {PingREQ} Message object
*/
PingREQ.deserialise = Message.deserialise.bind(null, PingREQ, params);
PingREQ.type = "PingREQ";
inherits(PingREQ, Message);

module.exports = PingREQ;
