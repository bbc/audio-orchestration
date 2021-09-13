var MessageParams = require("./MessageParams");

/**
 * @constructor
 * @name REQParams
 * @augments MessageParams
 * @param {string} type Specifies the message type
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId ID of the device that sent this message
 * @param {string} responseChannel Name of the channel to which the resonse is to be sent
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
module.exports = function () {
    return MessageParams().extend([
        { name: "contextId", type: "string", writable: false, optional: false },
        { name: "deviceId", type: "string", writable: false, optional: false },
        { name: "responseChannel", type: "string", writable: false, optional: false }
    ]);
};
