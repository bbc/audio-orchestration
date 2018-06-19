var VideoController, WeakMap, PRIVATE, events, inherits;

WeakMap = require("weak-map");
events = require("events");
inherits = require("inherits");

PRIVATE = new WeakMap();


VideoController = function (videoElement, controls) {

    var ctrl = controls || {};

    PRIVATE.set(this, {
        video: videoElement,
        playState: "paused"
    });

    controls.togglePlayState.on("click", togglePlayState.bind(this, controls.togglePlayState));
    controls.playPosition.on("change", seek.bind(this, controls.playPosition));

};

Object.defineProperties(VideoController.prototype, {
    "playState": {
        get: function () {
            return PRIVATE.get(this).playState;
        }
    }
});

inherits(VideoController, events);


function togglePlayState (btn) {
    var priv = PRIVATE.get(this);
    switch (priv.playState) {
        case "playing":
            pause.call(this);
            btn.innerHTML = "Play";
            break;
        case "paused":
            play.call(this);
            btn.innerHTML = "Pause";
            break;
        default:
            break;
    }
}

function play () {
    var priv = PRIVATE.get(this);
    priv.video.play();
    priv.playState = "playing";
    this.emit("play");
}

function pause () {
    var priv = PRIVATE.get(this);
    priv.video.pause();
    priv.playState = "paused";
    this.emit("pause");
}

function seek (controler) {
    var priv = PRIVATE.get(this);
    this.emit("seek", controler.value);
    priv.video.currentTime = controler.value; 
}


module.exports = VideoController;