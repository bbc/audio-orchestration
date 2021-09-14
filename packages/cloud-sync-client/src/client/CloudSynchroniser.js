var // Prototype inheritance
    inherits = require("inherits"),

    // Event emitter
    events = require("events"),

    // Polyfill for WeakMap (https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
    WeakMap = require("weak-map"),

    // Map to store private data
    PRIVATE = new WeakMap(),

    // Generic broker for messages to and from the sync service
    Messenger = require("$common/messenger/Messenger"),

    // Adapter for a concrete messaging library
    // (Instance is passed to constructor of Messenger)
    MessagingAdapter = require("$common/messenger/messagingadapter/MqttMessagingAdapter"),

    // Generates unique IDs for protocol messages sent to the sync service
    MessageIdGenerator = require("$common/message/MessageIdGenerator"),

    // Creates protocol messages to be sent to the sync service
    MessageFactory = require("$common/message/MessageFactory"),

    // Synchronises the local copy of the wallclock to wallclock service
    WallclockSynchroniser = require("./WallClockSynchroniser"),

    // Utilities to model clocks
    Clocks = require("dvbcss-clocks"),

    // Models a timeline
    Timeline = require("$common/timeline/Timeline"),

    // Generates a unique identifier for a timeline
    TimelineId = require("$common/timeline/TimelineId"),

    // Stores timeline references
    TimelineArray = require("$common/timeline/TimelineArray"),

    // Models presentation timestamps
    PresentationTimestamp = require("$common/timeline/PresentationTimestamp"),

    // Token buket for rate limiting of timeline upates
    TokenBucket = require("$common/util/TokenBucket"),

    // SyncTLElection enum
    SYNC_TL_ELECTION = require("$common/state/SyncTLElection"),

    // URL parser
    parseUrl = require("url-parse"),
    CloudSynchroniser;

var ENABLE_LOGGING = false;

function log() {
    if (ENABLE_LOGGING) {
        console.log(arguments);
    }
}

// Old versions of the "dvbcss-clocks" library have a incorrect
// implementation method of the toJSON method, which leads to errors
// when serialising a Correlation with JSON.stringify, thus we remove
// the method from the Correlation classe's prototype
//delete Clocks.Correlation.prototype.toJSON;

/**
 * Device registration succeeded
 * @event CloudSynchroniser#DeviceRegistrationSuccess
 * @type {object}
 * @property {number} returnCode
 */

/** 
 * An error occured during when the client aimed at registrating 
 * at the Synchronisation Service.
 * @event CloudSynchroniser#DeviceRegistrationError
 * @type {Object}
 * @property {number} errorCode Possible values:
 * <ul>
 *   <li>0 ... No error</li>
 *   <li>1 ... Failure during setup of Synchronisation-Service connection</li>
 *   <li>2 ... Failed to send Join request</li>
 *   <li>3 ... Received invalid wallclock url from Synchronisation Service</li>
 *   <li>4 ... Invalid SessionSyncController url</li>
 * </ul>
 * @property {string} errorMessage
 */

/** 
 * The connection to the wallclock service has become available.
 * A local copy of the wallclock is available
 * @event CloudSynchroniser#WallClockAvailable
 * @type {object}
 * @property {number} returnCode
 */

/**
 * The wallclock service has become unavailable
 * @event CloudSynchroniser#WallClockUnAvailable
 * @type {object}
 * @property {number} returnCode Possible values:
 */

/** 
 * The Synchronisation Service has become unavailable.
 * @event CloudSynchroniser#SyncServiceUnavailable
 * @type {object}
 * @property {number} returnCode 
 */

/** 
 * The Synchronisation Service has requested a timeline update.
 * @event CloudSynchroniser#TimelineRequest
 */

/** 
 * The Synchronisation Service has requested a content ID update.
 * @event CloudSynchroniser#ContentIDRequest
 */

/**
 * A requested timeline is available to this client.
 * @event CloudSynchroniser#TimelineAvailable
 * @type {Object}
 * @property {number} returnCode
 * @property {Timeline} timeline
 */

/** 
 * A timeline is available for synchronisation.
 * @event CloudSynchroniser#SyncTimelinesAvailable
 * @type {Object}
 * @property {number} returnCode
 * @property {Array<Timeline>} timelines
 */

/** 
 * A timeline has become unavailable.
 * @event CloudSynchroniser#SyncTimelineUnavailable
 * @type {Object}
 * @property {number} returnCode
 * @property {Timeline} timeline
 */

/** 
 * The synchronisation error exceeded a certain threshold.
 * @event CloudSynchroniser#LowSyncAccuracy
 * @type {Object}
 * @property {number} returnCode
 * @property {number} error
 */

/** 
 * The content ID changed on a monitored device. 
 * @event CloudSynchroniser#ContentIdChangedOnDevice
 * @type {Object}
 * @property {number} returnCode
 * @property {string} contentId
 */

/**
 * @class CloudSynchroniser
 * 
 * @classdesc Client library of the cloud Synchronisation Service.
 * 
 * @constructor
 * @param {string} syncUrl Address of the Synchronisation Service
 * @param {string} sessionId Identifier of the synchronisation session
 * @param {string} contextId Identifier of the synchronisation context
 * @param {string} deviceId Identifier of for this client, i.e. device
 * @param {object} options
 * @param {number} [options.syncTimelineElection=CloudSyncKit.SyncTLElection.EARLIEST_FIRST]
 *  Specifies the algorithm to be used by the sync service to elect the synchronisation timeline
 * 
 * @fires CloudSynchroniser#DeviceRegistrationSuccess
 * @fires CloudSynchroniser#DeviceRegistrationError
 * @fires CloudSynchroniser#WallClockAvailable
 * @fires CloudSynchroniser#WallClockUnAvailable
 * @fires CloudSynchroniser#TimelineRequest
 * @fires CloudSynchroniser#ContentIDRequest
 */
CloudSynchroniser = function (syncUrl, sessionId, contextId, deviceId, options) {

    var opt = options || {};

    // Private properties
    PRIVATE.set(this, {

        // Timelines provided by this devices
        ownTimelines: new TimelineArray(),

        // Timeline shadows, i.e. copies of timelines of other devices in this session
        timelineShadows: new TimelineArray(),

        // Local copy of the wallclock (a 'dvbcss-clocks' 'CorrelatedClock')
        wallclock: null,

        // Location of the wallclock service
        wcUrl: null,

        // Synchronises the local copy of the wallclock
        wallclockSynchroniser: null,

        // Location of the sync service
        syncUrl: syncUrl || null,

        // Identifier for the current sync-service session
        sessionId: sessionId || null,

        // Identifier for the current sync-service context
        contextId: contextId || null,

        // Identifier for this client
        deviceId: deviceId || null,

        // Identifier for the current piece of content being
        // played back on this client
        contentId: null,

        // Identifier for the current sync-service API version
        version: "0.0.1",

        // ??? (currently not used)
        availableTimelines: null,

        // Instance of 
        messenger: null,

        // Send setup messages to this topic
        onboardingTopic: "Sessions/REQ",

        // Send requests to this topics
        reqTopic: "Sessions/REQ",

        // Subscribe to this topic to receive responses
        respTopic: "Sessions/" + sessionId + "/" + deviceId + "/RESP",

        // Rate limit for timeline update
        // (can be overwritten by handler of JoinRESP message)
        rateLimit: {
            numUpdates: 10,
            interval: 5
        },

        // The sync timeline election algorithm
        syncTimelineElection: opt.syncTimelineElection || SYNC_TL_ELECTION.EARLIEST_FIRST,

        // Subscribe to this topic to receive session state changes
        sessionStateTopic: "Sessions/" + sessionId + "/" + "state",
        sessionApplicationBroadcastTopic: "Sessions/" + sessionId + "/" + "application-broadcast",

        // the system clock
        sysClock: options.sysClock || new Clocks.DateNowClock(),
    });

    setupSyncServiceConnection.call(this).
        catch(onSyncServiceConnectionFailure.bind(this)).

        then(joinSession.bind(this)).
        catch(this.emit.bind(this, "DeviceRegistrationFailure")).

        then(handleJoinResponse.bind(this)).
        catch(this.emit.bind(this, "DeviceRegistrationFailure")).

        then(this.emit.bind(this, "DeviceRegistrationSuccess")).

        then(performWallclockSync.bind(this));
};

inherits(CloudSynchroniser, events);


// ************************************
// PRIVATE
// ************************************

function setupSyncServiceConnection() {

    var priv, adapterOptions;

    priv = PRIVATE.get(this);

    adapterOptions = {};
    adapterOptions.sessionId = priv.sessionId;
    adapterOptions.contextId = priv.contextId;

    priv.adapter = new MessagingAdapter(priv.syncUrl.hostname, priv.syncUrl.port, priv.deviceId, adapterOptions);
    priv.adapter.on("connectionlost", onSyncServiceConnectionLost.bind(this));

    priv.messenger = new Messenger(priv.adapter);
    priv.messenger.on("message", onMessageReceived.bind(this));
    priv.messenger.on("request", onRequestReceived.bind(this));

    return new Promise(function (resolve, reject) {
        priv.adapter.on("connectionestablished", resolve);
        priv.adapter.on("connectionfailure", reject);
    });
}

function onMessageReceived(message) {
    log("Received message", message);
    switch (message.type) {
        case "TimelineUpdate":
            handleTimelineUpdate.call(this, message);
            break;
        case "SyncTimelinesAvailable":
            handleSyncTimelinesAvailable.call(this, message);
            break;
        case "DeviceStatus":
            handleDeviceStatus.call(this, message);
            break;
        case "ApplicationBroadcast":
            handleApplicationBroadcast.call(this, message);
            break;
        default:
            break;
    }
}

function onRequestReceived(request) {
    log("Received request", request);
    switch (request.type) {
        case "TimelineUpdateREQ":
            handleTimelineUpdateRequest.call(this, request);
            break;
        case "StopTimelineUpdateREQ":
            handleStopTimelineUpdateRequest.call(this, request);
            break;
        case "PingREQ":
            handlePingRequest.call(this, request);
            break;
        default:
            break;
    }
}

function onSyncServiceConnectionLost(e) {
    this.emit("SyncServiceUnavailable", {
        errorCode: 1,
        errorMessage: "Sync-Service connection terminated"
    });
}

function onSyncServiceConnectionFailure(e) {
    this.emit("DeviceRegistrationError", {
        errorCode: 1,
        errorMessage: e
    });
}

function joinSession() {

    var priv, self;

    self = this;
    priv = PRIVATE.get(this);

    priv.messenger.listen(priv.respTopic);
    priv.messenger.listen(priv.sessionStateTopic);
    priv.messenger.listen(priv.sessionApplicationBroadcastTopic);

    return new Promise(function (resolve, reject) {
        sendRequest.call(self, "JoinREQ", priv.onboardingTopic, resolve, {
            onMaxRetryFailed: console.error
        }, priv.respTopic, priv.syncTimelineElection);
    });
}

function handleJoinResponse(res) {

    var priv = PRIVATE.get(this);
    log("Handling JoinRESP", res);

    return new Promise(function (resolve, reject) {

        if (typeof res.wallclockUrl !== "string" || res.wallclockUrl.length < ("ws://").length) {
            reject({
                errorCode: 3,
                errorMessage: "Invalid wallclock url '" + res.wallclock + "'"
            });
            return;
        }

        if (typeof res.sessionSyncControllerUrl !== "string" || res.sessionSyncControllerUrl.length < ("ws://").length) {
            reject({
                errorCode: 4,
                errorMessage: "Invalid SessionSyncController url '" + res.sessionSyncControllerUrl + "'"
            });
            return;
        }

        if (typeof res.rateLimit === "object") {
            if (typeof res.rateLimit.numUpdates === "number") {
                res.rateLimit.numUpdates = res.rateLimit.numUpdates;
            }

            if (typeof res.rateLimit.interval === "number") {
                res.rateLimit.interval = res.rateLimit.interval;
            }
        }

        priv.wcUrl = parseUrl(res.wallclockUrl);
        resolve();

    });
}

function performWallclockSync() {

    var priv;
    priv = PRIVATE.get(this);

    priv.wallclock = new Clocks.CorrelatedClock(priv.sysClock);
    priv.wallclock.on("available", this.emit.bind(this, "WallClockAvailable"));
    priv.wallclock.on("unavailable", this.emit.bind(this, "WallClockUnAvailable"));

    priv.wallclockSynchroniser = new WallclockSynchroniser(
        priv.wcUrl.protocol + "//" + priv.wcUrl.hostname + priv.wcUrl.pathname,
        priv.wcUrl.port,
        priv.wallclock
    );

    priv.wallclockSynchroniser.start();
}

function handleResponse(response, resolve, reject) {
    log("Handling reponse:", response);
    if (response.responseCode === 0) {
        resolve(response);
    } else {
        reject(response);
    }
}


// ************************************
// PUBLIC
// ************************************

Object.defineProperties(CloudSynchroniser.prototype, {

    /**
     * [Clock]{@link https://doclets.io/bbc/dvbcss-clocks/master#dl-CorrelatedClock}
     * object representing the wallclock. The wallclock is available after the
     * [WallClockAvailable]{@link CloudSynchroniser#WallClockAvailable} event has been fired. Before that, 
     * the value of wallclock is NULL.
     * @var {CorrelatedClock} wallclock
     * @memberof CloudSynchroniser
     * @readonly
     * @instance
     */
    "wallclock": {
        get: function () { return PRIVATE.get(this).wallclock; }
    },

    /**
     * Identifier of the synchronisation session.
     * @var {string} sessionId
     * @memberof CloudSynchroniser
     * @readonly
     * @instance
     */
    "sessionId": {
        get: function () { return PRIVATE.get(this).sessionId; }
    },

    /**
     * Identifier of the synchronisation context.
     * @var {string} contextId
     * @memberof CloudSynchroniser
     * @readonly
     * @instance
     */
    "contextId": {
        get: function () { return PRIVATE.get(this).contextId; }
    },

    /**
     * Identifier for this device.
     * @var {string} deviceId
     * @memberof CloudSynchroniser
     * @instance
     */
    "contentId": {
        get: function () { return this.getContentId() },
        set: function (contentId) { return this.setContentId(contentId) }
    },

    /**
     * ??? (Timelines on this device OR timelines on other devices) ???
     * @var {Timeline[]} availableTimelines
     * @memberof CloudSynchroniser
     * @readonly
     * @instance
     */
    "availableTimelines": {
        get: function () { return PRIVATE.get(this).availableTimelines; }
    }
});


/**
 * Unregisters the client from Synchronisation Service
 * @fires CloudSynchroniser#SyncTimelineUnavailable
 * @fires CloudSynchroniser#WallClockUnAvailable
 * @fires CloudSynchroniser#SyncServiceUnavailable
 */
CloudSynchroniser.prototype.destroy = function () {

    var priv = PRIVATE.get(this);

    priv.wallclockSynchroniser.stop();
    // TODO: Check: emits: WallClockUnAvailable

    // TODO: Unregister timelines
    // TODO: Unsubscribe from timelines
    // TODO: Emit: SyncTimelineUnavailable

    sendRequest.call(this, "LeaveREQ", priv.reqTopic, function () { }, {});
    priv.messenger.stopListenAll();
    priv.messenger.disconnect();
};

/**
 * Get all devices available in this session
 * @returns {Promise<string[]>} List of device identifier strings
 */
CloudSynchroniser.prototype.getAvailableDevices = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        sendRequest.call(self, "DeviceREQ", PRIVATE.get(self).reqTopic, handleDeviceResponse.bind(self, resolve, reject), {});
    });
};

function handleDeviceResponse(resolve, reject, response) {
    var ownId = PRIVATE.get(this).deviceId;
    handleResponse(response, function (r) {
        var res = r.devices;
        res = res.filter(function (id) {
            if (id !== ownId) { return true; }
            return false
        });
        resolve(res);
    }, reject);
}

/**
 * Get all contexts in this session
 * @returns {Promise<string[]>} List of Context identifier strings
 */
CloudSynchroniser.prototype.getAvailableContexts = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        sendRequest.call(self, "ContextREQ", PRIVATE.get(self).reqTopic, handleContextResponse.bind(null, resolve, reject), {});
    });
};

function handleContextResponse(resolve, reject, response) {
    handleResponse(response, function (r) { resolve(r.contexts); }, reject);
}

/**
 * Get all devices in a given context
 * @param {string} contextId
 * @returns {Promise<string[]>} List of device identifier string
 */
CloudSynchroniser.prototype.allDevicesInContext = function (contextId) {
    return new Promise(function (resolve, reject) {
        // Send DeviceREQ
        // Receive DeviceRESP
    });
};

/**
 * Returns the content identifier
 * @param {string} contentId
 * @returns {Promise<number>} returnCode
 */
CloudSynchroniser.prototype.getContentId = function () {
    return PRIVATE.get(this).contentId;
}

/**
 * Sets the content identifier
 * @param {string} contentId
 */
CloudSynchroniser.prototype.setContentId = function (contentId) {

    var priv, message;

    priv = PRIVATE.get(this);
    priv.contentId = contentId;

    message = MessageFactory.create(
        "ContentIdChange",
        priv.sessionId,
        priv.deviceId,
        priv.contentId,
        MessageIdGenerator.getNewId(),
        priv.version
    );

    priv.messenger.send(message, priv.reqTopic);
    log("Sent:", message);
}

/**
 * Registers a timeline with the Synchronisation Service. The timeline is 
 * represented by a media object that exposes a known API to inspect the
 * media playback and read the current timeline position and speed.
 * @param {object} mediaObject
 * @param {string} timelineType
 * @param {string} contentId
 * @return {Promise<number>} returnCode
 */
CloudSynchroniser.prototype.addTimelineSource = function (mediaObject, timelineType, contentId, otherParams) {
    throw "Not implemented";
};

/**
 * Registers a timeline with the Synchronisation Service. The timeline is 
 * represented by a [Clock]{@link https://doclets.io/bbc/dvbcss-clocks/master#dl-ClockBase} object.
 * @param {Clock} clock
 * @param {string} timelineType
 * @param {string} contentId (previousely: timelineId, redundant)
 * @param {object} [options]
 * @param {boolean} [options.useForSessionSync=false]
 * @param {boolean} [options.writable=true]
 * @return {Promise<number>} returnCode
 */
CloudSynchroniser.prototype.addTimelineClock = function (clock, timelineType, contentId, options) {

    var priv, self, timelineId, opts;

    priv = PRIVATE.get(this);

    opts = options || {};

    timelineId = new TimelineId(priv.contextId, priv.deviceId, contentId).toUrnString();
    timeline = new Timeline(timelineId);
    timeline.timelineType = timelineType;
    timeline.contentId = contentId;
    timeline.clock = clock;
    timeline.clock.id = timelineId;
    timeline.useForSessionSync = typeof opts.useForSessionSync === "boolean" ? opts.useForSessionSync : false;
    timeline.writable = typeof opts.writable === "boolean" ? opts.writable : true;
    timeline.syncTimeline = null;

    if (timeline.useForSessionSync) {
        timeline.pairingState = 1; // Wait for pairing
    } else {
        timeline.pairingState = 0; // Do not pair
    }

    // Add token bucket for rate limiting of timeline updates sent to sync service
    timeline.tokenBucket = new TokenBucket(priv.rateLimit.numUpdates, priv.rateLimit.interval);

    priv.ownTimelines.add(timeline);

    self = this;
    log("Wallclocktime: ", priv.wallclock.now(), " clocktime:", clock.now());

    return new Promise(function (resolve, reject) {

        var wallclockNow = priv.wallclock.now();
        var clockNow = clock.now();
        log(clock.getNanos());
        var errorNow = priv.wallclock.dispersionAtTime(wallclockNow);

        var correlation = new Clocks.Correlation(priv.wallclock.now(), clock.now(), errorNow, 0);

        var corr = {
            parentTime: correlation.parentTime,
            childTime: correlation.childTime,
            initialError: errorNow,
            errorGrowthRate: 0.0,
            speed: clock.getEffectiveSpeed()
        };

        log(corr);

        var message = sendRequest.call(self,
            "TimelineRegistrationREQ",
            priv.reqTopic,
            handleTimelineRegistrationResponse.bind(self, resolve, reject, timelineId),
            {},
            corr,
            timeline.timelineId,
            timeline.contentId,
            timeline.timelineType,
            timeline.frequency,
            timeline.updateChannel,
            timeline.useForSessionSync,
            timeline.writable

        );
    });
};

function handleTimelineRegistrationResponse(resolve, reject, timelineId, response) {
    var priv, timeline;
    priv = PRIVATE.get(this);
    timeline = priv.ownTimelines.getById(timelineId);
    timeline.updateChannel = response.timelineUpdateChannel;
    handleResponse(response, resolve, reject);
}

function handleSyncTimelinesAvailable(message) {
    log("[CloudSynchroniser.js]:", "SyncTimelinesAvailable", message.timelineInfo);
    this.emit("SyncTimelinesAvailable", message.timelineInfo);
}

function handleApplicationBroadcast(message) {
    log("[CloudSynchroniser.js]:", "ApplicationBroadcast", message.broadcastTopic, message.broadcastContent);
    this.emit("ApplicationBroadcast", {
        deviceId: message.deviceId,
        topic: message.broadcastTopic,
        content: message.broadcastContent,
    });
}

function handleDeviceStatus(message) {
    log("[CloudSynchroniser.js]:", "DeviceStatus");
    this.emit("DeviceStatus", {
        deviceId: message.deviceId,
        status: message.status,
    });
}

function handleTimelineUpdateRequest(request) {
    var priv, message, clock, self, timeline;

    priv = PRIVATE.get(this);
    timeline = priv.ownTimelines.getById(request.timelineId);

    if (timeline !== null) {
        // Check if this listener is already set
        if (timeline.clock.listeners("change").indexOf(sendTimelineUpdate.bind(this, timeline)) > -1) {
            log("'change' listener for clock", timeline.clock.id, "already set");
        } else {
            timeline.clock.on("change", function (timeline) {
                log("Timeline clock", timeline.clock.id, "changed");
                if (
                    timeline.syncTimeline === null ||
                    Math.abs(timeline.clock.now() - timeline.syncTimeline.clock.now()) > 40 ||
                    timeline.clock.getEffectiveSpeed() !== timeline.syncTimeline.clock.getEffectiveSpeed()
                ) {
                    sendTimelineUpdate.call(this, timeline);
                } else {
                    log("Timeline-clock change does not cause significant change of corresponding sync timeline --> do not report");
                }
            }.bind(this, timeline));
            log("Set 'change' listener for clock", timeline.clock.id);
        }
        sendTimelineUpdateRESP.call(this, request);
        sendTimelineUpdate.call(this, timeline);
    }

    else {
        // TODO: some kind of error MGMT
        return;
    }
}

function sendTimelineUpdateRESP(request) {
    var priv, message;
    priv = PRIVATE.get(this);
    message = MessageFactory.create("TimelineUpdateRESP", priv.sessionId, 0, request.id, priv.version);
    priv.messenger.send(message, request.responseChannel);
    log("Sent:", message);
}

CloudSynchroniser.prototype.sendApplicationBroadcast = function (topic, content) {
    var priv, message;
    priv = PRIVATE.get(this);

    message = MessageFactory.create("ApplicationBroadcast", priv.sessionId, priv.deviceId, topic, content);
    priv.messenger.send(message, priv.sessionApplicationBroadcastTopic, { qos: 1 });
    log("Sent:", message);
}

function handleStopTimelineUpdateRequest() {
    var priv, timeline;
    priv = PRIVATE.get(this);
    timeline = priv.ownTimelines.getById(request.timelineId);
    if (timeline !== null) {
        timeline.clock.remove("change", sendTimelineUpdate.bind(this, timeline))
    }
}

function sendTimelineUpdate(timeline) {

    var priv, message;

    priv = PRIVATE.get(this);

    // Rate limit timeline updates sent to sync service
    if (timeline.tokenBucket.getToken() === null) return;

    message = MessageFactory.create(
        "TimelineUpdate",
        priv.sessionId,
        priv.deviceId,
        timeline.timelineId,
        timeline.timelineType,
        timeline.contentId,
        new PresentationTimestamp(timeline.clock, priv.wallclock, 0, 0),
        {
            timeS: timeline.clock.getNanos() / Math.pow(10, 9),
            dispersionS: timeline.clock.dispersionAtTime(timeline.clock.now())
        },
        null,
        priv.version
    );

    priv.messenger.send(message, timeline.updateChannel);
    log("Sent:", message);
}


/**
 * Deregisters a timeline from the Synchronisation Service.
 * @param {string} contentId (previousely: timelineId, redundant)
 * @return {Promise<number>} returnCode
 */
CloudSynchroniser.prototype.removeTimeline = function (timelineId) {
    return new Promise(function (resolve, reject) {
        // TimelineDeRegistrationREQ
        // --> ACK (returnCode)
    });
};


/**
 * Get all available timelines in this session.
 * @returns {Promise<TimelineInfo[]>}
 */
CloudSynchroniser.prototype.getAvailableTimelines = function () {
    var priv, self;

    priv = PRIVATE.get(this);
    self = this;

    return new Promise(function (resolve, reject) {
        var message = sendRequest.call(self, "TimelineREQ", priv.reqTopic, handleTimelineREQResponse.bind(null, resolve, reject), {});
    });
};

function handleTimelineREQResponse(resolve, reject, response) {
    handleResponse(response, function (r) { resolve(r.timelineInfo); }, reject);
}

/**
 * Get all available synchronisation timelines for this session.
 */
CloudSynchroniser.prototype.getAvailableSyncTimelines = function () {
    var request, priv;

    priv = PRIVATE.get(this);

    request = MessageFactory.create(
        "TimelineREQ",
        priv.sessionId,
        priv.contextId,
        priv.deviceId,
        priv.respTopic,
        MessageIdGenerator.getNewId(),
        priv.version,
        null, // provide-context ID
        null, // provider ID
        null, // timeline type
        null, // content ID
        true  // sync timelines only
    );

    return new Promise(function (resolve, reject) {
        priv.messenger.sendRequest(request, priv.reqTopic, handleTimelineREQResponse.bind(null, resolve, reject), {});
    });
}



/**
 * Registers for updates of a given timeline.
 * @param {TimelineId} timelineId
 * @returns {Promise<number>} returnCode
 * @fires CloudSynchroniser#TimelineAvailable
 */
CloudSynchroniser.prototype.subscribeTimeline = function (timelineId) {
    var priv, self;

    priv = PRIVATE.get(this);
    self = this;

    return new Promise(function (resolve, reject) {
        sendRequest.call(self, "TimelineSubscriptionREQ",
            priv.reqTopic,
            handleTimelineSubscriptionResponse.bind(self, resolve, reject, timelineId),
            {},
            timelineId
        );
    });
};


function handleTimelineSubscriptionResponse(resolve, reject, timelineId, response) {
    var priv, timeline;

    priv = PRIVATE.get(this);
    log("Received 'TimelineSubscriptionRESP':", response);

    if (response.responseCode === 0) {
        resolve(0);
        timeline = getTimelineShadow.call(this, timelineId);
        timeline.updateChannel = response.providerChannel;
        priv.messenger.listen(timeline.updateChannel);

        if (response.presentationTimestamp !== null) {
            updateTimelineShadow.call(this, timelineId, response.presentationTimestamp);
        }

    } else {
        // TODO: error MGMT
        console.error("enableTimelineSync:", response);
        reject();
    }
}

function handleTimelineUpdate(message) {
    updateTimelineShadow.call(this, message.timelineId, message.presentationTimestamp);
    log("Received timeline update", message);
}

function getTimelineShadow(timelineId) {
    var priv, timeline;

    priv = PRIVATE.get(this);
    timeline = priv.timelineShadows.getById(timelineId);

    if (timeline === null) {
        timeline = new Timeline(timelineId)
        timeline.clock = new Clocks.CorrelatedClock(priv.wallclock);
        timeline.clock.id = timelineId;
        timeline.clock.setAvailabilityFlag(false);
        timeline.clock.on("available", this.emit.bind(this, "TimelineAvailable", timelineId));
        log("Set 'available' listener on clock", timeline.clock.id);

        priv.timelineShadows.add(timeline);
    }

    return timeline;
}

function updateTimelineShadow(timelineId, presentationTimestamp) {
    var priv, timeline;
    priv = PRIVATE.get(this);
    timeline = getTimelineShadow.call(this, timelineId);
    timeline.update(presentationTimestamp.actual);
    timeline.clock.setAvailabilityFlag(true);
    log("Update timeline ID:", timelineId, "PTS:", presentationTimestamp);
}

CloudSynchroniser.prototype.synchronise = function (clock, timelineType, contentId) {
    var priv = PRIVATE.get(this);
    var timelineId = new TimelineId(priv.contextId, priv.deviceId, contentId).toUrnString();
    var timeline;

    this.addTimelineClock(clock, timelineType, contentId, { useForSessionSync: true });

    timeline = priv.ownTimelines.getById(timelineId);
    this.on("SyncTimelinesAvailable", pairTimeline.bind(this, timeline));
};

function pairTimeline(timeline, syncTimelines) {
    var stlShadow, self;

    self = this;

    syncTimelines.forEach(function (syncTimeline) {
        if (
            timeline.contentId === syncTimeline.contentId &&
            timeline.timelineType === syncTimeline.timelineType &&
            timeline.pairingState === 1
        ) {
            stlShadow = getTimelineShadow.call(self, syncTimeline.timelineId);
            stlShadow.update(syncTimeline.lastTimestamp);
            stlShadow.clock.setAvailabilityFlag(true);
            log("%c Created STL shadow from timestamp", "background-color:blue; color:white", syncTimeline.lastTimestamp);

            self.syncClockToThisTimeline(timeline.clock, syncTimeline.timelineId);
            self.subscribeTimeline(syncTimeline.timelineId);

            timeline.syncTimeline = stlShadow;
            timeline.pairingState = 2; // paired

            log("[CloudSynchroniser.js]: Paired TL ", timeline, "and STL", stlShadow);
        }
    });
}

/**
 * Synchronises a given clock to a given timeline.
 * @param {Clock} clock Slave clock
 * @param {TimelineId} timelineId Identifier of the master timeline
 * @param {Correlation} [correlation={parentTime:0, childTime:0, errorGrowthRate: 0, initialError: 0}] Correlation between clock and timeline 
 */
CloudSynchroniser.prototype.syncClockToThisTimeline = function (clock, timelineId, correlation) {
    var priv, timeline, corr;

    priv = PRIVATE.get(this);
    timeline = priv.timelineShadows.getById(timelineId);
    corr = correlation || new Clocks.Correlation({ parentTime: 0, childTime: 0, errorGrowthRate: 0, initialError: 0 });

    clock.setCorrelationAndSpeed(timeline.clock.getCorrelation(), timeline.clock.speed);
    timeline.clock.on("change", function () {
        clock.setCorrelationAndSpeed(timeline.clock.getCorrelation(), timeline.clock.speed);
    });

    log("Synchronising clock ID:", clock.id, "to timeline ID:", timelineId);
};


CloudSynchroniser.prototype.getTimelineClockById = function (timelineId) {
    var priv, res;
    priv = PRIVATE.get(this);
    res = priv.timelineShadows.getById(timelineId) || priv.ownTimelines.getById(timelineId);
    res = res.clock;
    return res;
};


/**
 * Synchronises a given media object to a given timeline.
 * @param {object} mediaObject The media object to be slave
 * @param {TimelineId} timelineId Identifier of the master timeline
 * @param {Correlation} [correlation={parentTime:0, childTime:0, speed: 1}] Correlation between media object and timeline 
 */
CloudSynchroniser.prototype.createSyncController = function (mediaObject, timelineId, correlation) {
    // ..
};


function handlePingRequest(request) {
    var priv, message;
    priv = PRIVATE.get(this);
    message = MessageFactory.create("PingRESP", priv.sessionId, 0, request.id, priv.version);
    priv.messenger.send(message, request.responseChannel);
    log("Sent:", message);
}

function sendRequest(type, channel, onresponse, options) {

    var args, priv, i, request, opt;

    priv = PRIVATE.get(this);
    opt = options || {};

    args = [];
    args[0] = type;
    args[1] = priv.sessionId;
    args[2] = priv.contextId;
    args[3] = priv.deviceId;
    args[4] = priv.respTopic;

    i = 4;

    // Add optional arguments
    if (arguments.length > 4) {
        for (; i < arguments.length; i++) {
            args[i + 1] = arguments[i];
        }
    }

    args[i + 1] = MessageIdGenerator.getNewId();
    args[i + 2] = priv.version;
    request = MessageFactory.create.apply(null, args);
    priv.messenger.sendRequest(request, channel, onresponse, options);

    log("Sent:", request);

    return request;
}

module.exports = CloudSynchroniser;
