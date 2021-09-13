var b64 = require("../util/b64"),
    URN = require("../util/URN"),
    TimelineId;

/**
 * @class TimelineId
 * 
 * @classdesc 
 * Globally unique identifier for a content timeline.
 * 
 * @example
 * // Create instance
 * var timlineId = new TimelineId("ctx1", "dvc1", "src1");
 * 
 * // Returns "urn:ctx1:dvc1:src1"
 * var urnString = timelineId.toUrnString();
 * 
 * // Creates new timeline instance from URN string
 * timelineId = TimelineId.parse(urnString);
 * 
 * // Returns "ctx1"
 * timelineId.contextId;
 * 
 * @constructor
 * @param {string} contextId
 * @param {string} deviceId
 * @param {string} sourceId
 */
TimelineId = function (contextId, deviceId, sourceId) {

    var contextId, deviceId, sourceId; 
    
    contextId = contextId;
    deviceId = deviceId;
    sourceId = sourceId;

    Object.defineProperties(this, {

        /**
         * @var {string} contextId
         * @memberof TimelineId
         * @readonly
         * @instance
         */
        "contextId": {
            get: function () { return contextId; },
            enumerable: true
        },

        /**
         * @var {string} deviceId
         * @memberof TimelineId
         * @readonly
         * @instance
         */
        "deviceId": {
            get: function () { return deviceId; },
            enumerable: true
        },

        /**
         * @var {string} sourceId
         * @memberof TimelineId
         * @readonly
         * @instance
         */
        "sourceId": {
            get: function () { return sourceId; },
            enumerable: true
        }
    });
};

/**
 * Converts the TimelineId obejct into URN string representation.
 * @returns {string} URN formatted string. 
 */
TimelineId.prototype.toUrnString = function () {
    var id = [];
    id.push(this.contextId);
    id.push(this.deviceId);
    id.push(b64.encodeUnicode(this.sourceId));
    return URN.stringify(id);
};

/**
 * Creates a TimelineId object from its URN string representation.
 * @param {string} urnString URN formatted string urn:<contextId>:<deviceId>:<sourceId>
 * @returns {TimelineId}
 */
TimelineId.fromUrnString = function (urnString) {
    var id, instance;
    id = URN.parse(urnString);
    id[2] = id[2] && b64.decodeUnicode(id[2]) || null;
    instance = new (Function.prototype.bind.apply(TimelineId, [null].concat(id)));
    return instance;
};

module.exports = TimelineId;