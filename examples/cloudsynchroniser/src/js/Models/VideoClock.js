var VideoClock, CorrelatedClock, WeakMap, PRIVATE, THRESHOLD_SIGNIFICANT_CHANGE;

CorrelatedClock = require("dvbcss-clocks").CorrelatedClock;
Correlation = require("dvbcss-clocks").Correlation;
WeakMap = require("weak-map");


PRIVATE = new WeakMap();
THRESHOLD_SIGNIFICANT_CHANGE = .02; // 20ms


VideoClock = function (parentClock, videoElement, videoController, thresholdSecs) {
    var priv, videoClock, self;

    self = this;

    videoClock = new CorrelatedClock(parentClock, {
        correlation: new Correlation({
            parentTime: parentClock.now(),
            childTime: videoElement.currentTime*parentClock.tickRate
        })
    });
    
    PRIVATE.set(this, {
        clock: videoClock,
        video: videoElement,
        parent: parentClock,
        thresh: thresholdSecs || THRESHOLD_SIGNIFICANT_CHANGE
    });

    videoController.controlBar.playToggle.on("click", function (e) {
        switch (e.currentTarget.title) {
            case "Pause":
                console.log("Pause");
                pauseClock.call(self);
                break;
            case "Play":
                console.log("Play");
                resumeClock.call(self);
                break;
            default:
                break;
        }
    });

    videoController.controlBar.progressControl.on("click", function (e) {
        console.log(e);
    })
    
    videoController.on("seeking", seekClock.bind(this));

    /*
     * Returns difference between clock that drives the video presentation
     * and the actual video playback position.
     */
    videoClock.getClockDiff = function () {
        return this.now()/this.tickRate - videoElement.currentTime;
    };

    return videoClock;
};

function pauseClock () {
    var priv = PRIVATE.get(this);
    // console.log("VideoClock: Handle media PAUSE");
    console.log("%c User caused PAUSE of video clock", "background-color:green; color: white;");
    updateClock.call(this, priv.video.currentTime*priv.parent.tickRate, 0);
}

function resumeClock () {
    var priv = PRIVATE.get(this);
    // console.log("VideoClock: Handle media PLAY");
    console.log("%c User caused RESUME of video clock", "background-color:green; color: white;");
    updateClock.call(this, priv.video.currentTime*priv.parent.tickRate, 1);
}

function seekClock (pos) {
    var priv = PRIVATE.get(this);
    if (pos.target.player.scrubbing_) {
        // console.log("VideoClock: Handle media SEEK to position", priv.video.currentTime);
        console.log("%c User caused SEEK of video clock" + "to position " + priv.video.currentTime, "background-color:green; color: white;");
        updateClock.call(this, priv.video.currentTime*priv.parent.tickRate, priv.video.playbackRate);
    }
}

function updateClock (newNow, newSpeed) {
    var priv, newCorr, parentTime;
    
    priv = PRIVATE.get(this);
    parentTime = priv.parent.now();
    newCorr = new Correlation(parentTime, newNow);

    if (priv.clock.isChangeSignificant(newCorr, newSpeed, priv.thresh)) {
        console.log("VideoClock:", "Setting new correltation", "(" + parentTime + ", " +  newNow + ")", "and speed", newSpeed);
        priv.clock.setCorrelationAndSpeed(newCorr, newSpeed);
    }
}

module.exports = VideoClock;