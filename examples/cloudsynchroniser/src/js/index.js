var CloudSyncKit, DeviceInfo, SessionInfo, config, Clocks, DisplayFactory,
    synchroniser, syncUrl, deviceInfo, sessionInfo, $, getUrlParameter,
    videoClock, videoCtrl, videoTimelineType;

CloudSyncKit = require("../../../../dist/browser/CloudSyncKit");
DisplayFactory = require("./Display/DisplayFactory");
DeviceInfo = require("./Models/DeviceInfo");
SessionInfo = require("./Models/SessionInfo");
config = require("../../config/config");
Clocks = require("dvbcss-clocks");
VideoSynchroniser = require("./Utility/VideoSynchroniser");
VideoClock = require("./Models/VideoClock");
VideoController = require("./Controls/VideoController");
$ = require("./Utility/$");
SelectList = require("./Controls/SelectList");
toastr = require("toastr");
videojs = require("video.js");

syncUrl = { hostname: config.hostname, port: config.port };

deviceInfo = new DeviceInfo();
deviceInfo.syncUrl = syncUrl.hostname + ":" + syncUrl.port;
deviceInfo.deviceId = uuidv4();

sessionInfo = new SessionInfo();
sessionInfo.contextId = getUrlParameter("contextId") || "default";
sessionInfo.sessionId = getUrlParameter("sessionId") || "default";
sessionInfo.electionAlgorithm = getUrlParameter("electionAlgorithm") || "EarliestFirst";
sessionInfo.timelineInfo = [];
sessionInfo.syncTimelineInfo = [];
videoClock = null;
videoCtrl = null;
videoTimelineType = "tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000";

window.addEventListener("load", init);

function init () {
    initSessionSettings();

    $("source")[0].src = getUrlParameter("video") || "http://hbbtv-live.irt.de/2immerse/video.mp4";

    DisplayFactory.createDeviceInfoDisplay("display", "Device Info", deviceInfo);
    DisplayFactory.createSessionInfoDisplay("display", "Session Info", sessionInfo);
    DisplayFactory.refreshAll();

    $("input").on("change", function () { 
        sessionInfo[this.name] = this.value || "default"; 
    });
    $(".cloudsynchroniser-api").on("click", doWhatsWrittenOnTheButton);
}

function initSessionSettings () {
    if (sessionInfo.sessionId !== "default") $("#sessionId").value = sessionInfo.sessionId;
    if (sessionInfo.contextId !== "default") $("#contextId").value = sessionInfo.contextId;
    if (sessionInfo.electionAlgorithm !== "EarliestFirst") {
        $("#EarliestFirst").removeAttribute("checked");
        $("#" + sessionInfo.electionAlgorithm).setAttribute("checked", true);
    }
}

function doWhatsWrittenOnTheButton () {
    eval(this.innerHTML);
}

function share (method) {

    var selectList, os;

    selectList =  [];
    selectList.push({ name: "QR code", action: showQrCode });
    selectList.push({ name: "e-mail", action: sendEmail });
    selectList.push({ name: "In new Window", action: openInNewWindow });
    selectList.push({ name: "In new Tab", action: openInNewTab });

    // Add share options for mobile platforms
    if (["android", "ios"].indexOf(getOs().toLowerCase()) > -1) {
        selectList.push({ name: "WhatsApp", action: sendWhatsApp });
    }

    selectList.push({ name: "Cancel", action: function () {} });
    
    $("body")[0].appendChild(new SelectList("Share via", selectList));
}

function getOs () {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("ios") > -1) return "ios";
    if (ua.indexOf("android") > -1) return "android";
    return "any";
}

function join (event) {
    var timelineElectionAlgorithm;

    console.log("Call:  CloudSyncKit.getCloudSynchroniser()");
    console.log("syncUrl:", JSON.stringify(syncUrl));

    switch (sessionInfo.electionAlgorithm) {
        case "EarliestFirst":
            timelineElectionAlgorithm = CloudSyncKit.SyncTLElection.EARLIEST_FIRST;
            break;
        case "LowestDispersion":
            timelineElectionAlgorithm = CloudSyncKit.SyncTLElection.LOWEST_DISPERSION;
            break;
        case "Dynamic":
            timelineElectionAlgorithm = CloudSyncKit.SyncTLElection.DYNAMIC;
            break;
        default:
            timelineElectionAlgorithm = CloudSyncKit.SyncTLElection.DYNAMIC;
            break;
    }
    console.log("timelineElectionAlgorithm = " , timelineElectionAlgorithm);

    synchroniser = CloudSyncKit.getCloudSynchroniser(
        syncUrl,
        sessionInfo.sessionId,
        sessionInfo.contextId,
        deviceInfo.deviceId,
        {
            syncTimelineElection: timelineElectionAlgorithm
        }
    );

    synchroniser.on("DeviceRegistrationError", handleDeviceRegistrationError);
    synchroniser.on("DeviceRegistrationSuccess", handleDeviceRegistrationSuccess);
    synchroniser.on("WallClockUnAvailable", handleWallClockUnAvailable);
    synchroniser.on("WallClockAvailable", handleWallClockAvailable);
    synchroniser.on("SyncServiceUnavailable", handleSyncServiceUnavailable);
    synchroniser.on("SyncTimelinesAvailable", handleSyncTimelinesAvailable);

    $("#btn-join").className = "pure-button button-error";
    $("#btn-join").innerHTML = "destroy()";
}

function handleDeviceRegistrationSuccess () {
    console.info("Event:", "DeviceRegistrationSuccess");
    toastr.info("DeviceRegistrationSuccess");
}

function handleDeviceRegistrationError (e) {
    console.error("DeviceRegistrationError", e);
    toastr.error("DeviceRegistrationError");
}

function handleWallClockAvailable () {
    console.info("Event:", "WallClockAvailable");
    displayWallclock();
    toastr.info("WallClockAvailable");
}

function handleWallClockUnAvailable () {
    console.error("Event:", "WallClockUnAvailable");
}

function handleSyncServiceUnavailable (e) {
    console.error("SyncServiceUnavailable", e);
    toastr.error("SyncServiceUnavailable");
}

function handleSyncTimelinesAvailable (e) {
    console.info("SyncTimelinesAvailable", e);
    toastr.success("SyncTimelinesAvailable (#STL: " + e.length + ")");


}


function destroy () {
    console.log("Call: CloudSynchroniser.destroy()");
    synchroniser.destroy();
}

function getAvailableDevices () {
    console.log("Call:  CloudSynchroniser.getAvailableDevices()");
    synchroniser.getAvailableDevices().
        catch (function (e) { console.error(e) }).
    then (function (devices) { 
        sessionInfo.devices = devices;
    });
}

function setContentId () {
    synchroniser.contentId = $("video")[0].src;
    deviceInfo.contentId = synchroniser.contentId;
}

function createVideoTimelineClock () {
    var video = $("video")[0];
    var videoCtrl = videojs("video", { muted: true, controls: true });
    
    if (videoClock === null) {
        videoClock = new VideoClock(synchroniser.wallclock, video, videoCtrl);
        videoClock.on("change", function () {
            console.log("%cVideo clock changed", "background-color:yellow;", JSON.stringify(videoClock));
        });
        
        DisplayFactory.createClockDisplay("display", "Video Clock", videoClock, "utc");
        // DisplayFactory.createPlayerInfoDisplay("videoContainer", "Player Info", video, videoClock, "utc");

        // Make video player follow the video clock
        VideoSynchroniser(videoClock, video);
    }
}

function synchroniseVideoTimelineClock () {
    createVideoTimelineClock();
    synchroniser.synchronise(videoClock, videoTimelineType, $("video")[0].src);
}

function addTimelineClock () {
    createVideoTimelineClock();
    synchroniser.addTimelineClock(videoClock, videoTimelineType, $("video")[0].src, {useForSessionSync: true, writable:true}).then(console.log);
}

function getAvailableTimelines () {
    console.log("Call: CloudSynchroniser.getAvailableTimelines()");

    synchroniser.getAvailableTimelines().
       catch (function (e) { console.error(e) }).
       then (function (timelineInfo) { 
           sessionInfo.timelineInfo = timelineInfo;
       });
}

function getAvailableSyncTimelines () {
    console.log("Call: CloudSynchroniser.getAvailableSyncTimelines()");

    synchroniser.getAvailableSyncTimelines().
       catch (function (e) { console.error(e) }).
       then (function (timelineInfo) { 
           sessionInfo.syncTimelineInfo = timelineInfo;
       });
}

function subscribeTimeline () {
    var timelines = sessionInfo.timelineInfo.concat(sessionInfo.syncTimelineInfo);
    createTimelineList(function () {
        console.log("Call: CloudSynchroniser.subscribeTimeline()");
        synchroniser.subscribeTimeline(this.name);
    }, "Subscribe to timeline", timelines);
}

function showTimelineClock () {
    var timelines = sessionInfo.timelineInfo.concat(sessionInfo.syncTimelineInfo);
    createTimelineList(function () {
        var timelineClock = synchroniser.getTimelineClockById(this.name);
        DisplayFactory.createClockDisplay("display", "Timeline Clock", timelineClock, "utc");
    }, "Subscribe to timeline", timelines);
}


function syncClockToThisTimeline () {
    var timelines = sessionInfo.timelineInfo.concat(sessionInfo.syncTimelineInfo);
    createTimelineList(function () {
        console.log("Call: CloudSynchroniser.syncClockToThisTimeline()");
        synchroniser.syncClockToThisTimeline(videoClock, this.name);
    }, "Select timeline", timelines);
}

function createTimelineList (onSelected, listHeading, timelines) {
    var selectList =  [];
    
    timelines.forEach(function (info) {
        selectList.push({
            name: info.timelineId,
            timelineInfo: info,
            action: onSelected
        });
    });

    selectList.push({ name: "Cancel", action: function () {} });
    
    $("body")[0].appendChild(new SelectList(listHeading, selectList));  
}

function getAvailableContexts () {
    console.log("Call: CloudSynchroniser.getAvailableContexts()");
    synchroniser.getAvailableContexts().
        catch (function (e) { console.error(e) }).
        then (function (contexts) { console.info("Available contexts:", contexts) });
}

function displayWallclock () {
    DisplayFactory.createClockDisplay("display", "Wallclock", synchroniser.wallclock);
}

function sendWhatsApp () {
    var message;
    
    message = "Like to watch synchronised video with me? Go to: " + createShareUrl();
    message = encodeURIComponent(message);

    window.location.href = "whatsapp://send?text=" + message;
}

function sendEmail () {
    var subject, message;
    
    subject = "Like to watch synchronised video with me?";
    subject = encodeURIComponent(subject);
    
    message = "Go to: " + createShareUrl();
    message = encodeURIComponent(message);

    window.location.href = "mailto:?subject=" + subject + "&body=" + message;
}

function showQrCode () {
    var body, div, overlay, qrc;

    div = document.createElement("div");
    div.style.position = "absolute";
    div.style.width = div.style.height = "500px";
    div.style.left = div.style.right = div.style.bottom = div.style.top = 0;
    div.style.margin = "auto";
    
    qrc = new QRCode(div, {
        text: createShareUrl(),
        width: 500,
        height: 500,
    });

    overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.appendChild(div);

    body = $("body")[0];
    body.appendChild(overlay);
    $(div).on("click", function () { body.removeChild(overlay) });
}

function openInNewTab () {
    window.open(createShareUrl());
}

function openInNewWindow () {
    window.open(createShareUrl(), "", "width=720,height=400");
}

function createShareUrl () {
    return appendUrlParams(location.href, [
        {
            name: "sessionId",
            value: sessionInfo.sessionId
        },
        {
            name: "contextId",
            value: sessionInfo.contextId
        },
        {
            name: "electionAlgorithm",
            value: sessionInfo.electionAlgorithm
        }
    ]);
}

function appendUrlParams (url, params) {
    params.forEach(function (param) {
        // Check if this parameter already exists
        if (getUrlParameter(param.name, url) === null) {
            url += url.indexOf("?") > -1 ? "&" : "?";
            url += param.name + "=" + param.value;
        }
    });
    return url;
}

function getUrlParameter (name, URL) {
    var url, regex, results;
    url = URL || location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    regex = new RegExp("[\\?&]"+name+"=([^&#]*)");
    results = regex.exec( url );
    return results == null ? null : results[1];
}


// source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4 () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}