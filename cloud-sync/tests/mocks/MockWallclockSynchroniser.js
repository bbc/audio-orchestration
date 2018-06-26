var events = require("events");
var inherits = require("inherits");

var WallclockSynchroniser = function (wallclockUrl, wallclockPort, clock) {
    var t_wallclockUrl = typeof wallclockUrl;
    var t_wallclockPort = typeof wallclockPort;
    var t_clock = typeof clock;

    if (t_wallclockUrl !== "string") throw "Unexpected type '" + t_wallclockUrl + "' for parameter 'wallclockUrl'";
    if (t_wallclockPort !== "string") throw "Unexpected type '" + t_wallclockPort + "' for parameter 'wallclockPort'";
    if (t_clock !== "object") throw "Unexpected type '" + t_clock + "' for parameter 'wallclockPort'";
};

inherits(WallclockSynchroniser, events);

WallclockSynchroniser.prototype.start = function () {
    setTimeout(this.emit.bind(this, "available"), 250);
};

WallclockSynchroniser.prototype.stop = function () {
    this.emit("unavailable");
};

module.exports = WallclockSynchroniser;