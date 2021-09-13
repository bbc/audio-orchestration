var CloudSyncKit,
    synchroniser,
    sessionInfo,
    syncServiceUrl,
    config,
    videojs,
    VideoClock,
    videoClock,
    VideoSynchroniser,
    share;


CloudSyncKit = require("./CloudSyncKit");
DispersionDisplay = require("./DispersionDisplay");
util = require("./util");
config = require("./config");
videojs = require("video.js");
VideoClock = require("./VideoClock");
VideoSynchroniser = require("./VideoSynchroniser");
share = require("./share");


sessionInfo = {};
sessionInfo.sessionId = null;
sessionInfo.contextId = null;
sessionInfo.electionAlgorithm = null;
sessionInfo.deviceId = util.uuidv4();

videoClock = null;
syncServiceUrl = { hostname: config.hostname, port: config.port};


window.addEventListener("load", init);


function init() {
    document.getElementsByTagName("source")[0].src = util.getUrlParameter("video") || "http://hbbtv-live.irt.de/2immerse/video.mp4";

    sessionInfo.sessionId = util.getUrlParameter("sessionId");
    sessionInfo.contextId = util.getUrlParameter("contextId");
    sessionInfo.electionAlgorithm = parseInt(util.getUrlParameter("electionAlgorithm"), 10);

    if (sessionInfo.sessionId === null) {
        askUserForSessionInfo(startSync);
    } else {
        startSync();
    }
}

function startSync() {
    synchroniser = CloudSyncKit.getCloudSynchroniser(syncServiceUrl, sessionInfo.sessionId, sessionInfo.contextId, sessionInfo.deviceId, {
        syncTimelineElection: sessionInfo.electionAlgorithm
    });
    synchroniser.on("DeviceRegistrationError", function (e) { console.error(e); });
    synchroniser.on("DeviceRegistrationSuccess", function (e) { console.info("Event:", "DeviceRegistrationSuccess"); });
    synchroniser.on("WallClockUnAvailable", function () { console.warn("Event:", "WallClockUnAvailable"); });
    synchroniser.on("WallClockAvailable", function () { console.info("Event:", "WallClockAvailable"); });
    synchroniser.on("WallClockAvailable", synchronise);
    synchroniser.on("SyncServiceUnavailable", function (e) { console.warn(e); });
    // synchroniser.on("TimelineAvailable", syncClockToThisTimeline);
}

function askUserForSessionInfo(onresponse) {
    var popup, body, overlay, callback;

    callback = onresponse || function () { };

    popup = "<div class='popup'>" +
        "<h3>" +
        "Enter session information to create a new session or join an exiting one." +
        "</h3>" +
        "<form class='pure-form pure-form-stacked'>" +
        "<fieldset>" +
        "<input id='sessionId' type='text' placeholder='Session ID'>" +
        "</fieldset>" +
        "<fieldset>" +
        "<legend>Chose sync-timline-election algorithm</legend>" +
        "<label for='EarliestFirst' class='pure-radio'>" +
        "<input id='EarliestFirst' type='radio' value='EarliestFirst' name='electionAlgorithm' checked> Earliest first" +
        "</label>" +
        "<label for='LowestDispersion' class='pure-radio'>" +
        "<input id='LowestDispersion' type='radio' value='LowestDispersion' name='electionAlgorithm'> Lowest dispersion" +
        "</label>" +
        "<label for='Dynamic' class='pure-radio'>" +
        "<input id='Dynamic' type='radio' value='Dynamic' name='electionAlgorithm'> Dynamic" +
        "</label>" +
        "</fieldset>" +
        "</form>" +
        "<button class='pure-button pure-button-primary' id='btn-submit'>Submit</button>" +
        "</div>";

    overlay = document.createElement("div");
    overlay.innerHTML = popup;
    overlay.className = "overlay";

    body = document.getElementsByTagName("body")[0];
    body.appendChild(overlay);

    document.getElementById("btn-submit").addEventListener("click", function () {
        sessionInfo.sessionId = document.getElementById("sessionId").value || "default";
        sessionInfo.contextId = "default";
        sessionInfo.electionAlgorithm = getElectionAlgorithm();
        body.removeChild(overlay);
        callback();
        return false;
    });
}

function getElectionAlgorithm() {
    var electionAlgorithm;

    switch (document.querySelector('input[name = "electionAlgorithm"]:checked').value) {
        case "EarliestFirst":
            electionAlgorithm = CloudSyncKit.SyncTLElection.EARLIEST_FIRST;
            break;
        case "LowestDispersion":
            electionAlgorithm = CloudSyncKit.SyncTLElection.LOWEST_DISPERSION;
            break;
        case "Dynamic":
            electionAlgorithm = CloudSyncKit.SyncTLElection.DYNAMIC;
            break;
        default:
            electionAlgorithm = CloudSyncKit.SyncTLElection.DYNAMIC;
            break;
    }

    return electionAlgorithm;
}

function synchronise() {
    var video, timelineType, shareButton, clockLogger, videoDiffLogger, videoSynchroniser, dispersionDisplay;

    video = videojs("video", { muted: true, controls: true });
    timelineType = "tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000";

    if (videoClock === null) {
        videoClock = new VideoClock(synchroniser.wallclock, document.getElementsByTagName("video")[0], video);
        clockLogger = new ClockLogger(videoClock);
        videoDiffLogger = new VideoDiffLogger(videoClock);
    }

    dispersionDisplay = new DispersionDisplay(videoClock, document.getElementById("dispersion-value"));

    videoClock.on("change", function () {
        console.log("Video clock changed: correlation:", videoClock.correlation, "speed:", videoClock.speed);
        clockLogger.sample();
        dispersionDisplay.show();
    });

    // synchroniser.addTimelineClock(videoClock, timelineType, video.currentSource().src, {
    //     useForSessionSync: true
    // }).then(getAvailableTimelines);

    synchroniser.synchronise(videoClock, timelineType, video.currentSource().src);

    // Make video player follow the video clock
    videoSynchroniser = new VideoSynchroniser(videoClock, document.getElementsByTagName("video")[0]);
    videoSynchroniser.on("sync", videoDiffLogger.sample);

    shareButton = addNewButton({
        player: video,
        text: "SHARE",
        id: "share"
    });

    shareButton.onclick = function () {
        share(sessionInfo);
    };

    console.info("Add timeline clock");
}

function addNewButton(data) {

    var myPlayer = data.player,
        controlBar,
        newElement = document.createElement("div"),
        newLink = document.createElement("a");

    newElement.id = data.id;
    newElement.className = "share vjs-control";

    newLink.innerHTML = data.text;
    newElement.appendChild(newLink);
    controlBar = document.getElementsByClassName("vjs-control-bar")[0];
    insertBeforeNode = document.getElementsByClassName("vjs-fullscreen-control")[0];
    controlBar.insertBefore(newElement, insertBeforeNode);

    return newElement;

}

// function getAvailableTimelines () {
//     synchroniser.getAvailableTimelines().then(enableTimelineSync);
//     console.info("Get available timelines");
// }

// function enableTimelineSync (timelines) {
//     if (timelines.length > 1) {
//         synchroniser.subscribeTimeline(timelines[0].timelineId);
//         console.info("Enable timeline sync");
//     }
// }

// function syncClockToThisTimeline (timelineId) {
//     synchroniser.syncClockToThisTimeline(videoClock, timelineId);
//     console.info("Sync clock to timeline");
// }

var ClockLogger = function (clock) {

    var clocks = [], timeout = null, self = this;

    this.sample = function () {
        clocks.push(new ClockLog(clock));

        if (timeout === null) {
            timeout = window.setTimeout(self.write, 5000);
        }
    };

    this.write = function () {
        sendClockLog(JSON.parse(JSON.stringify(clocks)));
        clocks = [];
        timeout = null;
    };

};

var ClockLog = function (clock) {
    return {
        dispersion: clock.dispersionAtTime(clock.now()),
        now: clock.now(),
        speed: clock.speed,
        correlation: {
            parentTime: clock.correlation.parentTime,
            childTime: clock.correlation.childTime,
            initialError: clock.correlation.initialError,
            errorGrowthRate: clock.correlation.errorGrowthRate
        }
    };
};

var VideoDiffLogger = function (clock) {
    var diffs = [], timeout = null, self = this;

    this.sample = function () {
        diffs.push(VideoDiffLog(clock));

        if (timeout === null) {
            timeout = window.setTimeout(self.write, 5000);
        }
    };

    this.write = function () {
        sendVideoDiffLog(JSON.parse(JSON.stringify(diffs)));
        diffs = [];
        timeout = null;
    };
}

var VideoDiffLog = function (videoClock) {
    return [videoClock.now() / videoClock.tickRate, videoClock.getClockDiff()];
}

function sendClockLog(clockLog) {
    sendObjLog({
        sessionInfo: sessionInfo,
        videoClock: clockLog
    }, "/log/dispersion");
}

function sendVideoDiffLog(log) {
    sendObjLog({
        sessionInfo: sessionInfo,
        videoClock: log
    }, "/log/videodiff");
}

function sendObjLog(obj, path) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(obj));
    console.log("Send log", JSON.stringify(obj));
}

