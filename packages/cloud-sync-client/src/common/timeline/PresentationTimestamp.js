var Timestamp = require("$common/timeline/Timestamp");

/**
 * @class PresentationTimestamp
 * 
 * @example <caption>Create a PresentationTimestamp from a CorrelatedClock and a wallclock</caption>
 * // mediaClock is a CorrelatedClock that represents the timeline of piece of content
 * // wallClock is a CorrelatedClock that represents the wallclock
 * // Set the earliest presentation time 5000 ticks before the actual presentation time
 * // Set the latest presentation time 8000 ticks after the actual presentation time  
 * var pts = new PresentationTimestamp(mediaClock, wallclock, -5000, 8000);
 * 
 * @example <caption>Create a PresentationTimestamp from its JSON string representation</caption>
 * // Assume we have a JSON string representation of a PresentationTimestamp called 'jsonPts'
 * // Convert to object using JSON.parse()
 * var ptsLikeObj = JSON.parse(jsonPts);
 * // To make this object an instance of PresentationTimestamp pass it to the contructor
 * var pts = new PresentationTimestamp(ptsLikeObj);
 * 
 * @constructor
 * @param {CorrelatedClock|Object} clockOrObject Either a clock object or a object with same properties as a instance of
 *      PresentationTimestamp (e.g. derived through JSON.parse(JSON.stringify(presentationTimestamp)))
 * @param {CorrelatedClock} [wallclock] 
 * @param {number} [offsetEarliest=0] 
 * @param {number} [offsetLatest=0] 
 */

var PresentationTimestamp = function (clockOrObject, wallclock, offsetEarliest, offsetLatest) {
    var earliest, actual, latest;
    
    // if (isClockObject(clockOrObject)) {
    //     earliest = new Timestamp(clockOrObject.now()+offsetEarliest, wallclock.now(), clockOrObject.speed);
    //     actual = new Timestamp(clockOrObject.now()+78, wallclock.now(), clockOrObject.speed);
    //     latest = new Timestamp(clockOrObject.now()+offsetLatest, wallclock.now(), clockOrObject.speed);
    // }

    // else {
    //     earliest = new Timestamp(clockOrObject.earliest.contentTime, clockOrObject.earliest.wallclockTime, clockOrObject.earliest.speed);
    //     actual = new Timestamp(clockOrObject.actual.contentTime+78, clockOrObject.actual.wallclockTime, clockOrObject.actual.speed);
    //     latest = new Timestamp(clockOrObject.latest.contentTime, clockOrObject.latest.wallclockTime, clockOrObject.latest.speed);
    // }


     
    if (isClockObject(clockOrObject)) {
        earliest = new Timestamp(clockOrObject.now()+offsetEarliest, wallclock.now(), clockOrObject.getEffectiveSpeed());
        actual = new Timestamp(clockOrObject.now(), wallclock.now(), clockOrObject.getEffectiveSpeed());
        latest = new Timestamp(clockOrObject.now()+offsetLatest, wallclock.now(), clockOrObject.getEffectiveSpeed());
    }

    else {
        earliest = new Timestamp(clockOrObject.earliest.contentTime, clockOrObject.earliest.wallclockTime, clockOrObject.earliest.speed);
        actual = new Timestamp(clockOrObject.actual.contentTime, clockOrObject.actual.wallclockTime, clockOrObject.actual.speed);
        latest = new Timestamp(clockOrObject.latest.contentTime, clockOrObject.latest.wallclockTime, clockOrObject.latest.speed);
    }

    Object.defineProperties(this, {
        /**
         * [Timestamp]{@link Timestamp} object representing the earliest possible time on the presentation timeline 
         * a client can present.
         * @var {Timestamp} earliest
         * @memberof PresentationTimestamp
         * @readonly
         * @instance
         */
        earliest: {
            value: earliest,
            enumerable: true
        },
        /**
         * [Timestamp]{@link Timestamp} object representing the actuale position on a client's presentation timeline.
         * @var {Timestamp} actual
         * @memberof PresentationTimestamp
         * @readonly
         * @instance
         */
        actual: {
            value: actual,
            enumerable: true
        },
        /**
         * [Timestamp]{@link Timestamp} object representing the latest possible time on the presentation timeline 
         * a client can present.
         * @var {Timestamp} latest
         * @memberof PresentationTimestamp
         * @readonly
         * @instance
         */
        latest: {
            value: latest,
            enumerable: true
        }
    });
};

function isClockObject (candidate) {
    // If these criteria are fulfilled the object is likely a clock object
    if (typeof candidate.getSpeed === "function" &&
        typeof candidate.now === "function" &&
        typeof candidate.setAtTime === "function" &&
        typeof candidate.setTickRate === "function")
    {
        return true;
    }
    return false;
}

module.exports = PresentationTimestamp;
