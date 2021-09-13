var PresentationTimestamp = require("./PresentationTimestamp");
var Correlation = require("dvbcss-clocks").Correlation;

/**
 * @class Timeline
 * @description
 *
 * Object representing a timeline instance
 *
 * @constructor
 * @param {string} timelineId Unique identifier for this timeline
 * @param {object} [options]
 * @param {string} [options.timelineType=null] Timeline type specifier
 * @param {number} [options.frequency=1000] Number of ticks per second on this timeline
 * @param {string} [options.contentId=null] Unique identifier for this timeline
 * @param {CorrelatedClock} [options.clock=null] Timeline clock
 * @param {string} [options.updateChannel=null] Channel to which updates of the timeline clock are reported
 * @param {number} [options.thresholdSecs=0.02] Signifcance threshold for changes to timeline clock
 * @param {boolean} [options.useForSessionSync=false] TRUE if this timeline shall be considered for synchronising,
 *  the whole session by the sync controller, else FALSE.
 * @param {boolean} [options.writable=true] TRUE if this timeline can be changed by calling timeline.update()
 */
var Timeline = function(timelineId, options) {

    var opt = options || {};

    if (typeof timelineId !== "string") {
        throw ("Missing one or more mandatory parameters or saw one or more wrong parameter types.");
    }

    Object.defineProperties(this, {
        "timelineId": {
            enumerable: true,
            value: timelineId
        },
        "timelineType": { 
            enumerable: true, 
            writable: true,
            value: opt.timelineType || null
        },
        "frequency": { 
            enumerable: true, 
            writable: true,
            value: opt.frequency || 1000
        },
        "contentId": {
            enumerable: true,
            writable: true,
            value: opt.contentId || null
        },
        "clock": {
            enumerable: true,
            writable: true,
            value: opt.clock || null
        },
        "updateChannel": {
            enumerable: true,
            writable: true,
            value: opt.updateChannel || null
        },
        "thresholdSecs": {
            enumerable: true,
            writable: true,
            value: opt.thresholdSecs || .02
        },
        "useForSessionSync": {
            enumerable: true,
            writable: true,
            value: opt.useForSessionSync || false
        },
        "writable": {
            enumerable: true,
            writable: true,
            value: opt.writable || true
        }
    });
};

/**
 * Updates clock correlation and speed, if change is significant.
 * Updates do only have an affect on writable timelines.
 * @param {Timestamp} timestamp
 * @returns {boolean} TRUE if clock was updated, else FALSE
 */
Timeline.prototype.update = function (timestamp) {
    
    var correlation = new Correlation({
        parentTime: timestamp.wallclockTime,
        childTime: timestamp.contentTime
    });
    
    if (this.writable && this.clock.isChangeSignificant(correlation, timestamp.speed, this.thresholdSecs)) {
        this.clock.setCorrelationAndSpeed(correlation, timestamp.speed);
        return true;
    }

    return false;
};

module.exports = Timeline;
