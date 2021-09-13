var ParameterList = require("./ParameterList");

/**
 * @constructor
 * @name MessageParams
 * @augments ParameterList 
 * @param {string} type Specifies the message type
 * @param {string} sessionId Specifies the session
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
module.exports = function () {
    return new ParameterList([
        { name: "type", type: "string", writable: false, optional: false },
        { name: "sessionId", type: "string", writable: false, optional: false },
        { name: "id", type: "string", writable: false, optional: true, default: null },
        { name: "version", type: "string", writable: false, optional: true, default: "0.0.1" }
    ]);
};
