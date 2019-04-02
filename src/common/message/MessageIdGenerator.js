var b64EncodeUnicode = require("../util/b64").encodeUnicode,
    b64DecodeUnicode = require("../util/b64").decodeUnicode,
    IdGenerator, MessageId, startTime, count;

startTime = new Date().getTime();
count = 0;

/**
 * 
 * @typedef {object} MessageId
 * @property {number} startTime
 * @property {number} count
 */
MessageId = function (startupTime, count) {
    this.startTime = startupTime;
    this.count = count;
};

function getNewId () {
    count++;
    id = new MessageId(startTime, count);
    return serialise(id);
};

function deserialise (id) {
    var deserialised = b64DecodeUnicode(id);
    deserialised = deserialised.split("-");
    return new MessageId(deserialised[0], deserialised[1]);
}

function serialise (id) {
    var serialised = id.startTime + "-" + id.count;
    return b64EncodeUnicode(serialised);
}

/**
 * @module
 * @name MessageIdGenerator
 */
module.exports = {

    /**
     * Generates an identifier which is unique per Browser session.
     * @function
     * @returns {string}
     */
    getNewId: getNewId,

    /**
     * Deserialises an ID string generated with getNewId.
     * @function
     * @returns {MessageId}
     */
    deserialise: deserialise
};