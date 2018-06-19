/**
 * @class Timestamp
 * 
 * @example <caption>Create a Timestamp from a CorrelatedClock and wallclock object</caption>
 * // mediaClock is a CorrelatedClock object that represents a clients presentation timeline
 * // wallclock is a CorrelatedClock object that represents the wallclock
 * var ts = new Timestamp(mediaClock, wallclock)
 * ts.contentTime // equals mediaClock.now()
 * ts.wallclockTime // equals wallclock.now()
 * ts.speed // equals mediaClock.now()
 * 
 * @example <caption>Create a Timestamp object from number values</caption>
 * // content time [ticks], wallclock time [ticks], speed
 * var ts = new Timestamp(1000, 1254376, 1.0);
 * ts.contentTime // equals 1000
 * ts.wallclockTime // equals 1254376
 * ts.speed // equals 1.0
 * 
 * @constructor
 * @param {CorrelatedClock|number} objectOrNumber 
 * @param {CorrelatedClock|number} wallclock 
 * @param {number} [clockSpeed] 
 */
var Timestamp = function (objectOrNumber, wallclock, clockSpeed) {
    
    var contentTime;
    var wallclockTime;
    var contentSpeed;

    var typeofClock = typeof objectOrNumber;
    var typeofWallclock = typeof wallclock;

    if (typeofClock === "object" && typeofWallclock === "object") {
        contentTime = objectOrNumber.now();
        wallclockTime = wallclock.now();
        contentSpeed = objectOrNumber.getSpeed();
    }

    else if (typeofClock === "number" && typeofWallclock === "number") {
        contentTime = objectOrNumber;
        wallclockTime = wallclock;
        contentSpeed = typeof clockSpeed !== "number" ? 1 : clockSpeed;
    }

    else {
        throw "Unexpected type"; 
    }

    Object.defineProperties(this, {
        /**
         * Time in ticks on the content timeline
         * @var {number} contentTime
         * @memberof Timestamp
         * @readonly
         * @instance
         */
        contentTime: {
            value: contentTime,
            enumerable: true
        },
        /**
         * Time in ticks on the wallclock
         * @var {number} wallclock
         * @memberof Timestamp
         * @readonly
         * @instance
         */
        wallclockTime: {
            value: wallclockTime,
            enumerable: true
        },
        /**
         * Speed of the content timeline
         * @var {number} speed
         * @memberof Timestamp
         * @readonly
         * @instance
         */
        speed: {
            value: contentSpeed,
            enumerable: true
        }
    });
};

module.exports = Timestamp;