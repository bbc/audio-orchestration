var PlayPositionDisplay, WeakMap, PRIVATE, instanceCount, msToTimeString, $;

WeakMap = require("weak-map");
msToTimeString = require("../Utility/Converter").msToTimeString;
$ = require("../Utility/$");

PRIVATE = new WeakMap();
instanceCount = 0;


PlayPositionDisplay = function (parent, video, slider) {
    var container;

    container = document.createElement("div");

    PRIVATE.set(this, {
        video: video,
        display: container,
        id: ++instanceCount,
        slider: slider
    });

    container.id = id.call(this, "pos");
    container.className = "right";
    $("#"+parent).appendChild(container);
};

PlayPositionDisplay.prototype.refresh = function () {
    var priv = PRIVATE.get(this);
    priv.display.innerHTML = msToTimeString(priv.video.currentTime*1000, "utc") + " / " + msToTimeString(priv.video.duration*1000, "utc");
    priv.slider.max = priv.video.duration;
    priv.slider.value = priv.video.currentTime;
};

function id (suffix) {
    return "playpos-" + PRIVATE.get(this).id + "-" + suffix;
}

module.exports = PlayPositionDisplay;