var MessageParams = require("./MessageParams");

/**
 * @constructor
 * @name RESParams
 * @augments MessageParams
 * @param {string} type Specifies the message type
 * @param {string} sessionId Specifies the session
 * @param {number} responseCode Specifies if server process succeeded or failed
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
module.exports = function () {
    return MessageParams().extend([
        { name: "responseCode", type: "number", writable: false, optional: false }
    ]);
}
