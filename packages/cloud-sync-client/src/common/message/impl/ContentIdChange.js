var inherits = require("inherits"),
    Message = require("Message"),
    MessageParams = require("MessageParams"),
    params, ContentIdChange;

/**
 * @constructor
 * @name ContentIdChange
 * @augments Message
 * @param {string} sessionId Specifies the session
 * @param {string} contextId Identfies the devices context
 * @param {string} deviceId Identfier of the device that sent this message
 * @param {string} contentId Unique identifier for a piece of content
 * @param {string} [id=null] Unique identifier for this message
 * @param {string} [version="0.0.1"] Version of the message API
 */
params = MessageParams().extend([
    { name: "deviceId", type: "string", writable: false, optional: false },
    { name: "contentId", type: "string", writable: false, optional: false }
]).get();

ContentIdChange = function () { Message.call(this, ContentIdChange.type, arguments, params); };

/**
 * Transforms the message to JSON string
 * @function
 * @override
 * @memberof ContentIdChange
 * @param {string} messageString JSON representation of the message
 * @returns {ContentIdChange} Message object
 */
ContentIdChange.deserialise = Message.deserialise.bind(null, ContentIdChange, params);
ContentIdChange.type = "ContentIdChange";
inherits(ContentIdChange, Message);

module.exports = ContentIdChange;