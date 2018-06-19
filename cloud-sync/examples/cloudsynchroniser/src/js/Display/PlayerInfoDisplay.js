var inherits, WeakMap, Display, Converter, PlayerInfoDisplay, PRIVATE, instanceCount, msToTimeString, $;

inherits = require("inherits");
WeakMap = require("weak-map");
Display = require("./Display");
msToTimeString = require("../Utility/Converter").msToTimeString;
$ = require("../Utility/$");

PRIVATE = new WeakMap();
instanceCount = 0;

PlayerInfoDisplay = function (parent, name, video, clock) {

    var priv, display;

    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);

    priv.id = ++instanceCount;
    priv.video = video;
    priv.clock = clock;

    display = document.createElement("div");
    display.className = "pure-u-1";

    display.innerHTML = '' +
        '<table class="pure-table pure-table-bordered">' +
            '<thead>' +
                '<tr>' +
                    '<th colspan="2">' + name + '</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                '<tr>' +
                    '<td>Play Position</td>' +
                    '<td id=' + id.call(this, 'playpos') + '>-</td>' +
                '</tr>' +
                '<tr>' +
                    '<td>Difference to Video Clock</td>' +
                    '<td id=' + id.call(this, 'clockdiff') + '>-</td>' +
                '</tr>' +
                '<tr>' +
                    '<td>Playback Rate</td>' +
                    '<td id=' + id.call(this, 'speed') + '>-</td>' +
                '</tr>' +
                '<tr>' +
                    '<td>Play State</td>' +
                    '<td id=' + id.call(this, 'playstate') + '>-</td>' +
                '</tr>' +
            '</tbody>' +
        '</table>';
        
    $("#"+parent).appendChild(display);
};

inherits(PlayerInfoDisplay, Display);


function id (suffix) {
    return "clientvideo-" + PRIVATE.get(this).id + "-" + suffix;
}

function getPlayState (video) {
    if (video.paused) {
        return "paused";
    } else if (video.ended) {
        return "ended";
    } else if (video.seeking) {
        return "seeking";
    } else {
        return "playing";
    }
}

function round (val, numDigits) {
    return Math.round( Math.pow(10,numDigits) * val)/ Math.pow(10,numDigits);
}

function showPlayPos (video) {
    return msToTimeString(video.currentTime*1000, "utc") + " / " + msToTimeString(video.duration*1000, "utc");
}

PlayerInfoDisplay.prototype.refresh = function () {
    var priv = PRIVATE.get(this);
    priv.video = $("#video");
    $("#"+id.call(this, 'playpos')).innerHTML = showPlayPos(priv.video);
    $("#"+id.call(this, 'clockdiff')).innerHTML = round(priv.video.currentTime - priv.clock.now()/1000, 3);
    $("#"+id.call(this, 'speed')).innerHTML = priv.video.playbackRate;
    $("#"+id.call(this, 'playstate')).innerHTML = getPlayState(priv.video);
};

module.exports = PlayerInfoDisplay;