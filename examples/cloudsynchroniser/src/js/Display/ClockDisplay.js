var inherits, WeakMap, Display, Converter, ClockDisplay, PRIVATE, instanceCount, msToTimeString;

inherits = require("inherits");
WeakMap = require("weak-map");
Display = require("./Display");
Converter = require("../Utility/Converter");

PRIVATE = new WeakMap();
instanceCount = 0;
msToTimeString = Converter.msToTimeString;

ClockDisplay = function (parent, name, clock, timeformat) {

    var priv, display;

    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);
    priv.id = ++instanceCount;
    priv.clock = clock;
    priv.timeformat = timeformat || "timestring";

    display = '' +
        '<div class="pure-u-1">' +
            '<table class="pure-table pure-table-bordered">' +
                '<thead>' +
                    '<tr>' +
                        '<th colspan="3">' + name + '</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr>' +
                        '<td colspan="2">id</td>' +
                        '<td id=' + id.call(this, 'id') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="2">Now</td>' +
                        '<td id=' + id.call(this, 'now') + '>--:--:-- \'---</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="2">Effective speed</td>' +
                        '<td id=' + id.call(this, 'speed') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td colspan="2">Dispersion</td>' +
                        '<td id=' + id.call(this, 'dispersion') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td rowspan="4">Correlation</td>' +
                        '<td>parentTime</td>' +
                        '<td id=' + id.call(this, 'parenttime') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>childTime</td>' +
                        '<td id=' + id.call(this, 'childtime') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>initialError</td>' +
                        '<td id=' + id.call(this, 'initialerror') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>errorGrowthRate</td>' +
                        '<td id=' + id.call(this, 'errorgrowthrate') + '>-</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
        
    $(parent).innerHTML += display;
};

inherits(ClockDisplay, Display);


function $ (identifier) {
    return document.getElementById(identifier);
}

function id (suffix) {
    return "clockdisplay-" + PRIVATE.get(this).id + "-" + suffix;
}

function round (val, numDigits) {
    return Math.round( Math.pow(10,numDigits) * val)/ Math.pow(10,numDigits);
}

function convert (timeMS, ) {
    return msToTimeString(timeMS, PRIVATE.get(this).timeformat);
}

ClockDisplay.prototype.refresh = function () {
    var priv = PRIVATE.get(this);
    $(id.call(this, 'id')).innerHTML = priv.clock.id;
    $(id.call(this, 'now')).innerHTML = convert.call(this, priv.clock.now(), priv.clock.tickRate);
    $(id.call(this, 'speed')).innerHTML = priv.clock.getEffectiveSpeed();
    $(id.call(this, 'dispersion')).innerHTML = round(priv.clock.dispersionAtTime(priv.clock.now()), 6);
    $(id.call(this, 'parenttime')).innerHTML = convert.call(this, priv.clock.correlation.parentTime);
    $(id.call(this, 'childtime')).innerHTML = convert.call(this, priv.clock.correlation.childTime);
    $(id.call(this, 'initialerror')).innerHTML = round(priv.clock.correlation.initialError, 6);
    $(id.call(this, 'errorgrowthrate')).innerHTML = round(priv.clock.correlation.errorGrowthRate, 6);
};

module.exports = ClockDisplay;