module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var CloudSynchroniser, instance;

	CloudSynchroniser = __webpack_require__(1);
	const SyncTLElection = __webpack_require__(241);

	/**
	 * @namespace CloudSyncKit
	 *
	 * @description Factory to create an instance or retrieve a reference to the
	 * existing instance of CloudSynchroniser (singleton).
	 */
	module.exports = {
	    /**
	     * 
	     * Returns an instance of CloudSynchroniser
	     * @param {string} syncUrl
	     * @param {string} sessionId
	     * @param {string} contextId
	     * @param {string} deviceId
	     * @param {object} options
	     * @param {number} [options.syncTimelineElection=CloudSyncKit.SyncTLElection.EARLIEST_FIRST]
	     *  Specifies the algorithm to be used by the sync service to elect the synchronisation timeline
	     * @returns {CloudSynchroniser}
	     * 
	     * @memberof CloudSyncKit
	     */
	    getCloudSynchroniser: function (syncUrl, sessionId, contextId, deviceId, options) {
	        if (instance !== null) {
	            instance = new CloudSynchroniser(syncUrl, sessionId, contextId, deviceId, options);
	        }
	        return instance;
	    },

	    SyncTLElection: SyncTLElection
	};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var // Prototype inheritance
	    inherits = __webpack_require__(2),

	    // Event emitter
	    events = __webpack_require__(3),

	    // Polyfill for WeakMap (https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
	    WeakMap = __webpack_require__(4),

	    // Map to store private data
	    PRIVATE = new WeakMap(),

	    // Generic broker for messages to and from the sync service
	    Messenger = __webpack_require__(5),

	    // Adapter for a concrete messaging library
	    // (Instance is passed to constructor of Messenger)
	    MessagingAdapter = __webpack_require__(45),

	    // Generates unique IDs for protocol messages sent to the sync service
	    MessageIdGenerator = __webpack_require__(210),

	    // Creates protocol messages to be sent to the sync service
	    MessageFactory = __webpack_require__(6),

	    // Synchronises the local copy of the wallclock to wallclock service
	    WallclockSynchroniser = __webpack_require__(212),

	    // Utilities to model clocks
	    Clocks = __webpack_require__(220),

	    // Models a timeline
	    Timeline = __webpack_require__(234),

	    // Generates a unique identifier for a timeline
	    TimelineId = __webpack_require__(237),

	    // Stores timeline references
	    TimelineArray = __webpack_require__(239),

	    // Models presentation timestamps
	    PresentationTimestamp = __webpack_require__(235),

	    // Token buket for rate limiting of timeline upates
	    TokenBucket = __webpack_require__(240),

	    // SyncTLElection enum
	    SYNC_TL_ELECTION = __webpack_require__(241),

	    // URL parser
	    parseUrl = __webpack_require__(242),
	    CloudSynchroniser;

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
	        onboardingTopic:  "Sessions/REQ",

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
	        sessionStateTopic: "Sessions/" + sessionId + "/" + "state"
	    });

	    setupSyncServiceConnection.call(this).
	        catch( onSyncServiceConnectionFailure.bind(this)).
	    
	    then( joinSession.bind(this)).
	        catch( this.emit.bind(this, "DeviceRegistrationFailure")).
	    
	    then( handleJoinResponse.bind(this)).
	        catch( this.emit.bind(this, "DeviceRegistrationFailure")).
	    
	    then( this.emit.bind(this, "DeviceRegistrationSuccess")).
	    
	    then( performWallclockSync.bind(this));
	};

	inherits(CloudSynchroniser, events);


	// ************************************
	// PRIVATE
	// ************************************

	function setupSyncServiceConnection () {
	    
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

	function onMessageReceived (message) {
	    console.log("Received message", message);
	    switch (message.type) {
	        case "TimelineUpdate":
	            handleTimelineUpdate.call(this, message);
	            break;
	        case "SyncTimelinesAvailable":
	            handleSyncTimelinesAvailable.call(this, message);
	            break;
	        default:
	            break;
	    }
	}

	function onRequestReceived (request) {
	    console.log("Received request", request);
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

	function onSyncServiceConnectionLost (e) {
	    this.emit("SyncServiceUnavailable", {
	        errorCode: 1,
	        errorMessage: "Sync-Service connection terminated"
	    });
	}

	function onSyncServiceConnectionFailure (e) {
	    this.emit("DeviceRegistrationError", {
	        errorCode: 1,
	        errorMessage: e
	    });
	}

	function joinSession () {
	    
	    var priv, self;

	    self = this;
	    priv = PRIVATE.get(this);

	    priv.messenger.listen(priv.respTopic);
	    priv.messenger.listen(priv.sessionStateTopic);

	    return new Promise(function (resolve, reject) {
	        sendRequest.call(self, "JoinREQ", priv.onboardingTopic, resolve, {
	            onMaxRetryFailed: console.error
	        }, priv.respTopic, priv.syncTimelineElection);
	    });
	}

	function handleJoinResponse (res) {

	    var priv = PRIVATE.get(this);
	    console.log("Handling JoinRESP", res);

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

	function performWallclockSync () {
	    
	    var priv;
	    priv = PRIVATE.get(this);
	    
	    priv.wallclock = new Clocks.CorrelatedClock(new Clocks.DateNowClock());
	    priv.wallclock.on("available", this.emit.bind(this, "WallClockAvailable"));
	    priv.wallclock.on("unavailable", this.emit.bind(this, "WallClockUnAvailable"));
	    
	    priv.wallclockSynchroniser = new WallclockSynchroniser(
	        priv.wcUrl.protocol + "//" + priv.wcUrl.hostname,
	        priv.wcUrl.port,
	        priv.wallclock
	    );

	    priv.wallclockSynchroniser.start();
	}

	function handleResponse (response, resolve, reject) {
	    console.log("Handling reponse:", response);
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

	    sendRequest.call(this, "LeaveREQ", priv.reqTopic, function () {}, {});
	    priv.messenger.stopListenAll();
	    priv.messenger.disconnect();
	};

	/**
	 * Get all devices available in this session
	 * @returns {Promise<string[]>} List of device identifier strings
	 */
	CloudSynchroniser.prototype.getAvailableDevices = function () {
	    var  self = this;
	    return new Promise(function (resolve, reject) {
	        sendRequest.call(self, "DeviceREQ", PRIVATE.get(self).reqTopic, handleDeviceResponse.bind(self, resolve, reject), {});
	    });
	};

	function handleDeviceResponse (resolve, reject, response) {
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

	function handleContextResponse (resolve, reject, response) {
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
	    console.log("Sent:", message);
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
	    console.log("Wallclocktime: ", priv.wallclock.now(), " clocktime:" , clock.now());

	    return new Promise(function (resolve, reject) {

	        var wallclockNow = priv.wallclock.now();
	        var clockNow = clock.now();
	        console.log(clock.getNanos());
	        var errorNow = priv.wallclock.dispersionAtTime(wallclockNow);

	        var correlation = new Clocks.Correlation(priv.wallclock.now(), clock.now(), errorNow, 0);

	        var corr = { parentTime: correlation.parentTime,
	            childTime: correlation.childTime,
	            initialError: errorNow,
	            errorGrowthRate: 0.0,
	            speed: clock.getEffectiveSpeed()
	        };

	        console.log(corr);

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

	function handleSyncTimelinesAvailable (message) {
	    console.log("[CloudSynchroniser.js]:", "SyncTimelinesAvailable", message.timelineInfo);
	    this.emit("SyncTimelinesAvailable", message.timelineInfo);
	}

	function handleTimelineUpdateRequest (request) {
	    var priv, message, clock, self, timeline;

	    priv = PRIVATE.get(this);
	    timeline = priv.ownTimelines.getById(request.timelineId);

	    if (timeline !== null) {
	        // Check if this listener is already set
	        if (timeline.clock.listeners("change").indexOf(sendTimelineUpdate.bind(this, timeline)) > -1) {
	            console.log("'change' listener for clock", timeline.clock.id, "already set");
	        } else {
	            timeline.clock.on("change", function (timeline) {
	                console.log("Timeline clock", timeline.clock.id, "changed");
	                if (
	                    timeline.syncTimeline === null || 
	                    Math.abs(timeline.clock.now() - timeline.syncTimeline.clock.now()) > 40
	                ) {
	                    sendTimelineUpdate.call(this, timeline);
	                } else {
	                    console.log("Timeline-clock change does not cause significant change of corresponding sync timeline --> do not report");
	                }
	            }.bind(this, timeline));
	            console.log("Set 'change' listener for clock", timeline.clock.id);
	        }
	        sendTimelineUpdateRESP.call(this, request);
	        sendTimelineUpdate.call(this, timeline);
	    } 
	    
	    else {
	        // TODO: some kind of error MGMT
	        return;
	    }
	}

	function sendTimelineUpdateRESP (request) {
	    var priv, message;
	    priv = PRIVATE.get(this);
	    message = MessageFactory.create("TimelineUpdateRESP", priv.sessionId, 0, request.id, priv.version);
	    priv.messenger.send(message, request.responseChannel);
	    console.log("Sent:", message);
	}

	function handleStopTimelineUpdateRequest () {
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
	            timeS: timeline.clock.getNanos()/Math.pow(10, 9),
	            dispersionS: timeline.clock.dispersionAtTime(timeline.clock.now())
	        },
	        null,
	        priv.version
	    );

	    priv.messenger.send(message, timeline.updateChannel);
	    console.log("Sent:", message);
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

	function handleTimelineREQResponse (resolve, reject, response) {
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

	    return new Promise (function (resolve, reject) {
	        sendRequest.call(self, "TimelineSubscriptionREQ",
	            priv.reqTopic,
	            handleTimelineSubscriptionResponse.bind(self, resolve, reject, timelineId),
	            {},
	            timelineId
	        );
	    });
	};


	function handleTimelineSubscriptionResponse (resolve, reject, timelineId, response) {
	    var priv, timeline;
	    
	    priv = PRIVATE.get(this);
	    console.log("Received 'TimelineSubscriptionRESP':", response);

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

	function handleTimelineUpdate (message) {
	    updateTimelineShadow.call(this, message.timelineId, message.presentationTimestamp);
	    console.log("Received timeline update", message);
	}

	function getTimelineShadow (timelineId) {
	    var priv, timeline;

	    priv = PRIVATE.get(this);
	    timeline = priv.timelineShadows.getById(timelineId);

	    if (timeline === null) {
	        timeline = new Timeline(timelineId)
	        timeline.clock = new Clocks.CorrelatedClock(priv.wallclock);
	        timeline.clock.id = timelineId;
	        timeline.clock.setAvailabilityFlag(false);
	        timeline.clock.on("available", this.emit.bind(this, "TimelineAvailable", timelineId));
	        console.log("Set 'available' listener on clock", timeline.clock.id);
	        
	        priv.timelineShadows.add(timeline);
	    }
	    
	    return timeline;
	}

	function updateTimelineShadow (timelineId, presentationTimestamp) {
	    var priv, timeline;
	    priv = PRIVATE.get(this);
	    timeline = getTimelineShadow.call(this, timelineId);
	    timeline.update(presentationTimestamp.actual);
	    timeline.clock.setAvailabilityFlag(true);
	    console.log("Update timeline ID:", timelineId, "PTS:", presentationTimestamp);
	}

	CloudSynchroniser.prototype.synchronise = function (clock, timelineType, contentId) {
	    var priv = PRIVATE.get(this);
	    var timelineId = new TimelineId(priv.contextId, priv.deviceId, contentId).toUrnString();
	    var timeline;

	    this.addTimelineClock(clock, timelineType, contentId, { useForSessionSync: true });

	    timeline = priv.ownTimelines.getById(timelineId);
	    this.on("SyncTimelinesAvailable", pairTimeline.bind(this, timeline));
	};

	function pairTimeline (timeline, syncTimelines) {
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
	            console.log("%c Created STL shadow from timestamp", "background-color:blue; color:white", syncTimeline.lastTimestamp);

	            self.syncClockToThisTimeline(timeline.clock, syncTimeline.timelineId);
	            self.subscribeTimeline(syncTimeline.timelineId);

	            timeline.syncTimeline = stlShadow;
	            timeline.pairingState = 2; // paired

	            console.log("[CloudSynchroniser.js]: Paired TL ", timeline, "and STL", stlShadow);
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
	    corr = correlation || new Clocks.Correlation({ parentTime:0, childTime:0, errorGrowthRate: 0, initialError: 0 });
	    
	    clock.setCorrelationAndSpeed(timeline.clock.getCorrelation(), timeline.clock.speed);
	    timeline.clock.on("change", function () {
	        clock.setCorrelationAndSpeed(timeline.clock.getCorrelation(), timeline.clock.speed);
	    });
	    
	    console.log("Synchronising clock ID:", clock.id, "to timeline ID:", timelineId);
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


	function handlePingRequest (request) {
	    var priv, message;
	    priv = PRIVATE.get(this);
	    message = MessageFactory.create("PingRESP", priv.sessionId, 0, request.id, priv.version);
	    priv.messenger.send(message, request.responseChannel);
	    console.log("Sent:", message);
	}

	function sendRequest (type, channel, onresponse, options) {
	    
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
	            args[i+1] = arguments[i];
	        }
	    }

	    args[i+1] = MessageIdGenerator.getNewId();
	    args[i+2] = priv.version;
	    request = MessageFactory.create.apply(null, args);
	    priv.messenger.sendRequest(request, channel, onresponse, options);

	    console.log("Sent:", request);

	    return request;
	}

	module.exports = CloudSynchroniser;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	// Copyright (C) 2011 Google Inc.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.

	/**
	 * @fileoverview Install a leaky WeakMap emulation on platforms that
	 * don't provide a built-in one.
	 *
	 * <p>Assumes that an ES5 platform where, if {@code WeakMap} is
	 * already present, then it conforms to the anticipated ES6
	 * specification. To run this file on an ES5 or almost ES5
	 * implementation where the {@code WeakMap} specification does not
	 * quite conform, run <code>repairES5.js</code> first.
	 *
	 * <p>Even though WeakMapModule is not global, the linter thinks it
	 * is, which is why it is in the overrides list below.
	 *
	 * <p>NOTE: Before using this WeakMap emulation in a non-SES
	 * environment, see the note below about hiddenRecord.
	 *
	 * @author Mark S. Miller
	 * @requires crypto, ArrayBuffer, Uint8Array, navigator, console
	 * @overrides WeakMap, ses, Proxy
	 * @overrides WeakMapModule
	 */

	/**
	 * This {@code WeakMap} emulation is observably equivalent to the
	 * ES-Harmony WeakMap, but with leakier garbage collection properties.
	 *
	 * <p>As with true WeakMaps, in this emulation, a key does not
	 * retain maps indexed by that key and (crucially) a map does not
	 * retain the keys it indexes. A map by itself also does not retain
	 * the values associated with that map.
	 *
	 * <p>However, the values associated with a key in some map are
	 * retained so long as that key is retained and those associations are
	 * not overridden. For example, when used to support membranes, all
	 * values exported from a given membrane will live for the lifetime
	 * they would have had in the absence of an interposed membrane. Even
	 * when the membrane is revoked, all objects that would have been
	 * reachable in the absence of revocation will still be reachable, as
	 * far as the GC can tell, even though they will no longer be relevant
	 * to ongoing computation.
	 *
	 * <p>The API implemented here is approximately the API as implemented
	 * in FF6.0a1 and agreed to by MarkM, Andreas Gal, and Dave Herman,
	 * rather than the offially approved proposal page. TODO(erights):
	 * upgrade the ecmascript WeakMap proposal page to explain this API
	 * change and present to EcmaScript committee for their approval.
	 *
	 * <p>The first difference between the emulation here and that in
	 * FF6.0a1 is the presence of non enumerable {@code get___, has___,
	 * set___, and delete___} methods on WeakMap instances to represent
	 * what would be the hidden internal properties of a primitive
	 * implementation. Whereas the FF6.0a1 WeakMap.prototype methods
	 * require their {@code this} to be a genuine WeakMap instance (i.e.,
	 * an object of {@code [[Class]]} "WeakMap}), since there is nothing
	 * unforgeable about the pseudo-internal method names used here,
	 * nothing prevents these emulated prototype methods from being
	 * applied to non-WeakMaps with pseudo-internal methods of the same
	 * names.
	 *
	 * <p>Another difference is that our emulated {@code
	 * WeakMap.prototype} is not itself a WeakMap. A problem with the
	 * current FF6.0a1 API is that WeakMap.prototype is itself a WeakMap
	 * providing ambient mutability and an ambient communications
	 * channel. Thus, if a WeakMap is already present and has this
	 * problem, repairES5.js wraps it in a safe wrappper in order to
	 * prevent access to this channel. (See
	 * PATCH_MUTABLE_FROZEN_WEAKMAP_PROTO in repairES5.js).
	 */

	/**
	 * If this is a full <a href=
	 * "http://code.google.com/p/es-lab/wiki/SecureableES5"
	 * >secureable ES5</a> platform and the ES-Harmony {@code WeakMap} is
	 * absent, install an approximate emulation.
	 *
	 * <p>If WeakMap is present but cannot store some objects, use our approximate
	 * emulation as a wrapper.
	 *
	 * <p>If this is almost a secureable ES5 platform, then WeakMap.js
	 * should be run after repairES5.js.
	 *
	 * <p>See {@code WeakMap} for documentation of the garbage collection
	 * properties of this WeakMap emulation.
	 */
	(function WeakMapModule() {
	  "use strict";

	  if (typeof ses !== 'undefined' && ses.ok && !ses.ok()) {
	    // already too broken, so give up
	    return;
	  }

	  /**
	   * In some cases (current Firefox), we must make a choice betweeen a
	   * WeakMap which is capable of using all varieties of host objects as
	   * keys and one which is capable of safely using proxies as keys. See
	   * comments below about HostWeakMap and DoubleWeakMap for details.
	   *
	   * This function (which is a global, not exposed to guests) marks a
	   * WeakMap as permitted to do what is necessary to index all host
	   * objects, at the cost of making it unsafe for proxies.
	   *
	   * Do not apply this function to anything which is not a genuine
	   * fresh WeakMap.
	   */
	  function weakMapPermitHostObjects(map) {
	    // identity of function used as a secret -- good enough and cheap
	    if (map.permitHostObjects___) {
	      map.permitHostObjects___(weakMapPermitHostObjects);
	    }
	  }
	  if (typeof ses !== 'undefined') {
	    ses.weakMapPermitHostObjects = weakMapPermitHostObjects;
	  }

	  // IE 11 has no Proxy but has a broken WeakMap such that we need to patch
	  // it using DoubleWeakMap; this flag tells DoubleWeakMap so.
	  var doubleWeakMapCheckSilentFailure = false;

	  // Check if there is already a good-enough WeakMap implementation, and if so
	  // exit without replacing it.
	  if (typeof WeakMap === 'function') {
	    var HostWeakMap = WeakMap;
	    // There is a WeakMap -- is it good enough?
	    if (typeof navigator !== 'undefined' &&
	        /Firefox/.test(navigator.userAgent)) {
	      // We're now *assuming not*, because as of this writing (2013-05-06)
	      // Firefox's WeakMaps have a miscellany of objects they won't accept, and
	      // we don't want to make an exhaustive list, and testing for just one
	      // will be a problem if that one is fixed alone (as they did for Event).

	      // If there is a platform that we *can* reliably test on, here's how to
	      // do it:
	      //  var problematic = ... ;
	      //  var testHostMap = new HostWeakMap();
	      //  try {
	      //    testHostMap.set(problematic, 1);  // Firefox 20 will throw here
	      //    if (testHostMap.get(problematic) === 1) {
	      //      return;
	      //    }
	      //  } catch (e) {}

	    } else {
	      // IE 11 bug: WeakMaps silently fail to store frozen objects.
	      var testMap = new HostWeakMap();
	      var testObject = Object.freeze({});
	      testMap.set(testObject, 1);
	      if (testMap.get(testObject) !== 1) {
	        doubleWeakMapCheckSilentFailure = true;
	        // Fall through to installing our WeakMap.
	      } else {
	        module.exports = WeakMap;
	        return;
	      }
	    }
	  }

	  var hop = Object.prototype.hasOwnProperty;
	  var gopn = Object.getOwnPropertyNames;
	  var defProp = Object.defineProperty;
	  var isExtensible = Object.isExtensible;

	  /**
	   * Security depends on HIDDEN_NAME being both <i>unguessable</i> and
	   * <i>undiscoverable</i> by untrusted code.
	   *
	   * <p>Given the known weaknesses of Math.random() on existing
	   * browsers, it does not generate unguessability we can be confident
	   * of.
	   *
	   * <p>It is the monkey patching logic in this file that is intended
	   * to ensure undiscoverability. The basic idea is that there are
	   * three fundamental means of discovering properties of an object:
	   * The for/in loop, Object.keys(), and Object.getOwnPropertyNames(),
	   * as well as some proposed ES6 extensions that appear on our
	   * whitelist. The first two only discover enumerable properties, and
	   * we only use HIDDEN_NAME to name a non-enumerable property, so the
	   * only remaining threat should be getOwnPropertyNames and some
	   * proposed ES6 extensions that appear on our whitelist. We monkey
	   * patch them to remove HIDDEN_NAME from the list of properties they
	   * returns.
	   *
	   * <p>TODO(erights): On a platform with built-in Proxies, proxies
	   * could be used to trap and thereby discover the HIDDEN_NAME, so we
	   * need to monkey patch Proxy.create, Proxy.createFunction, etc, in
	   * order to wrap the provided handler with the real handler which
	   * filters out all traps using HIDDEN_NAME.
	   *
	   * <p>TODO(erights): Revisit Mike Stay's suggestion that we use an
	   * encapsulated function at a not-necessarily-secret name, which
	   * uses the Stiegler shared-state rights amplification pattern to
	   * reveal the associated value only to the WeakMap in which this key
	   * is associated with that value. Since only the key retains the
	   * function, the function can also remember the key without causing
	   * leakage of the key, so this doesn't violate our general gc
	   * goals. In addition, because the name need not be a guarded
	   * secret, we could efficiently handle cross-frame frozen keys.
	   */
	  var HIDDEN_NAME_PREFIX = 'weakmap:';
	  var HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'ident:' + Math.random() + '___';

	  if (typeof crypto !== 'undefined' &&
	      typeof crypto.getRandomValues === 'function' &&
	      typeof ArrayBuffer === 'function' &&
	      typeof Uint8Array === 'function') {
	    var ab = new ArrayBuffer(25);
	    var u8s = new Uint8Array(ab);
	    crypto.getRandomValues(u8s);
	    HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'rand:' +
	      Array.prototype.map.call(u8s, function(u8) {
	        return (u8 % 36).toString(36);
	      }).join('') + '___';
	  }

	  function isNotHiddenName(name) {
	    return !(
	        name.substr(0, HIDDEN_NAME_PREFIX.length) == HIDDEN_NAME_PREFIX &&
	        name.substr(name.length - 3) === '___');
	  }

	  /**
	   * Monkey patch getOwnPropertyNames to avoid revealing the
	   * HIDDEN_NAME.
	   *
	   * <p>The ES5.1 spec requires each name to appear only once, but as
	   * of this writing, this requirement is controversial for ES6, so we
	   * made this code robust against this case. If the resulting extra
	   * search turns out to be expensive, we can probably relax this once
	   * ES6 is adequately supported on all major browsers, iff no browser
	   * versions we support at that time have relaxed this constraint
	   * without providing built-in ES6 WeakMaps.
	   */
	  defProp(Object, 'getOwnPropertyNames', {
	    value: function fakeGetOwnPropertyNames(obj) {
	      return gopn(obj).filter(isNotHiddenName);
	    }
	  });

	  /**
	   * getPropertyNames is not in ES5 but it is proposed for ES6 and
	   * does appear in our whitelist, so we need to clean it too.
	   */
	  if ('getPropertyNames' in Object) {
	    var originalGetPropertyNames = Object.getPropertyNames;
	    defProp(Object, 'getPropertyNames', {
	      value: function fakeGetPropertyNames(obj) {
	        return originalGetPropertyNames(obj).filter(isNotHiddenName);
	      }
	    });
	  }

	  /**
	   * <p>To treat objects as identity-keys with reasonable efficiency
	   * on ES5 by itself (i.e., without any object-keyed collections), we
	   * need to add a hidden property to such key objects when we
	   * can. This raises several issues:
	   * <ul>
	   * <li>Arranging to add this property to objects before we lose the
	   *     chance, and
	   * <li>Hiding the existence of this new property from most
	   *     JavaScript code.
	   * <li>Preventing <i>certification theft</i>, where one object is
	   *     created falsely claiming to be the key of an association
	   *     actually keyed by another object.
	   * <li>Preventing <i>value theft</i>, where untrusted code with
	   *     access to a key object but not a weak map nevertheless
	   *     obtains access to the value associated with that key in that
	   *     weak map.
	   * </ul>
	   * We do so by
	   * <ul>
	   * <li>Making the name of the hidden property unguessable, so "[]"
	   *     indexing, which we cannot intercept, cannot be used to access
	   *     a property without knowing the name.
	   * <li>Making the hidden property non-enumerable, so we need not
	   *     worry about for-in loops or {@code Object.keys},
	   * <li>monkey patching those reflective methods that would
	   *     prevent extensions, to add this hidden property first,
	   * <li>monkey patching those methods that would reveal this
	   *     hidden property.
	   * </ul>
	   * Unfortunately, because of same-origin iframes, we cannot reliably
	   * add this hidden property before an object becomes
	   * non-extensible. Instead, if we encounter a non-extensible object
	   * without a hidden record that we can detect (whether or not it has
	   * a hidden record stored under a name secret to us), then we just
	   * use the key object itself to represent its identity in a brute
	   * force leaky map stored in the weak map, losing all the advantages
	   * of weakness for these.
	   */
	  function getHiddenRecord(key) {
	    if (key !== Object(key)) {
	      throw new TypeError('Not an object: ' + key);
	    }
	    var hiddenRecord = key[HIDDEN_NAME];
	    if (hiddenRecord && hiddenRecord.key === key) { return hiddenRecord; }
	    if (!isExtensible(key)) {
	      // Weak map must brute force, as explained in doc-comment above.
	      return void 0;
	    }

	    // The hiddenRecord and the key point directly at each other, via
	    // the "key" and HIDDEN_NAME properties respectively. The key
	    // field is for quickly verifying that this hidden record is an
	    // own property, not a hidden record from up the prototype chain.
	    //
	    // NOTE: Because this WeakMap emulation is meant only for systems like
	    // SES where Object.prototype is frozen without any numeric
	    // properties, it is ok to use an object literal for the hiddenRecord.
	    // This has two advantages:
	    // * It is much faster in a performance critical place
	    // * It avoids relying on Object.create(null), which had been
	    //   problematic on Chrome 28.0.1480.0. See
	    //   https://code.google.com/p/google-caja/issues/detail?id=1687
	    hiddenRecord = { key: key };

	    // When using this WeakMap emulation on platforms where
	    // Object.prototype might not be frozen and Object.create(null) is
	    // reliable, use the following two commented out lines instead.
	    // hiddenRecord = Object.create(null);
	    // hiddenRecord.key = key;

	    // Please contact us if you need this to work on platforms where
	    // Object.prototype might not be frozen and
	    // Object.create(null) might not be reliable.

	    try {
	      defProp(key, HIDDEN_NAME, {
	        value: hiddenRecord,
	        writable: false,
	        enumerable: false,
	        configurable: false
	      });
	      return hiddenRecord;
	    } catch (error) {
	      // Under some circumstances, isExtensible seems to misreport whether
	      // the HIDDEN_NAME can be defined.
	      // The circumstances have not been isolated, but at least affect
	      // Node.js v0.10.26 on TravisCI / Linux, but not the same version of
	      // Node.js on OS X.
	      return void 0;
	    }
	  }

	  /**
	   * Monkey patch operations that would make their argument
	   * non-extensible.
	   *
	   * <p>The monkey patched versions throw a TypeError if their
	   * argument is not an object, so it should only be done to functions
	   * that should throw a TypeError anyway if their argument is not an
	   * object.
	   */
	  (function(){
	    var oldFreeze = Object.freeze;
	    defProp(Object, 'freeze', {
	      value: function identifyingFreeze(obj) {
	        getHiddenRecord(obj);
	        return oldFreeze(obj);
	      }
	    });
	    var oldSeal = Object.seal;
	    defProp(Object, 'seal', {
	      value: function identifyingSeal(obj) {
	        getHiddenRecord(obj);
	        return oldSeal(obj);
	      }
	    });
	    var oldPreventExtensions = Object.preventExtensions;
	    defProp(Object, 'preventExtensions', {
	      value: function identifyingPreventExtensions(obj) {
	        getHiddenRecord(obj);
	        return oldPreventExtensions(obj);
	      }
	    });
	  })();

	  function constFunc(func) {
	    func.prototype = null;
	    return Object.freeze(func);
	  }

	  var calledAsFunctionWarningDone = false;
	  function calledAsFunctionWarning() {
	    // Future ES6 WeakMap is currently (2013-09-10) expected to reject WeakMap()
	    // but we used to permit it and do it ourselves, so warn only.
	    if (!calledAsFunctionWarningDone && typeof console !== 'undefined') {
	      calledAsFunctionWarningDone = true;
	      console.warn('WeakMap should be invoked as new WeakMap(), not ' +
	          'WeakMap(). This will be an error in the future.');
	    }
	  }

	  var nextId = 0;

	  var OurWeakMap = function() {
	    if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
	      calledAsFunctionWarning();
	    }

	    // We are currently (12/25/2012) never encountering any prematurely
	    // non-extensible keys.
	    var keys = []; // brute force for prematurely non-extensible keys.
	    var values = []; // brute force for corresponding values.
	    var id = nextId++;

	    function get___(key, opt_default) {
	      var index;
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        return id in hiddenRecord ? hiddenRecord[id] : opt_default;
	      } else {
	        index = keys.indexOf(key);
	        return index >= 0 ? values[index] : opt_default;
	      }
	    }

	    function has___(key) {
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        return id in hiddenRecord;
	      } else {
	        return keys.indexOf(key) >= 0;
	      }
	    }

	    function set___(key, value) {
	      var index;
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        hiddenRecord[id] = value;
	      } else {
	        index = keys.indexOf(key);
	        if (index >= 0) {
	          values[index] = value;
	        } else {
	          // Since some browsers preemptively terminate slow turns but
	          // then continue computing with presumably corrupted heap
	          // state, we here defensively get keys.length first and then
	          // use it to update both the values and keys arrays, keeping
	          // them in sync.
	          index = keys.length;
	          values[index] = value;
	          // If we crash here, values will be one longer than keys.
	          keys[index] = key;
	        }
	      }
	      return this;
	    }

	    function delete___(key) {
	      var hiddenRecord = getHiddenRecord(key);
	      var index, lastIndex;
	      if (hiddenRecord) {
	        return id in hiddenRecord && delete hiddenRecord[id];
	      } else {
	        index = keys.indexOf(key);
	        if (index < 0) {
	          return false;
	        }
	        // Since some browsers preemptively terminate slow turns but
	        // then continue computing with potentially corrupted heap
	        // state, we here defensively get keys.length first and then use
	        // it to update both the keys and the values array, keeping
	        // them in sync. We update the two with an order of assignments,
	        // such that any prefix of these assignments will preserve the
	        // key/value correspondence, either before or after the delete.
	        // Note that this needs to work correctly when index === lastIndex.
	        lastIndex = keys.length - 1;
	        keys[index] = void 0;
	        // If we crash here, there's a void 0 in the keys array, but
	        // no operation will cause a "keys.indexOf(void 0)", since
	        // getHiddenRecord(void 0) will always throw an error first.
	        values[index] = values[lastIndex];
	        // If we crash here, values[index] cannot be found here,
	        // because keys[index] is void 0.
	        keys[index] = keys[lastIndex];
	        // If index === lastIndex and we crash here, then keys[index]
	        // is still void 0, since the aliasing killed the previous key.
	        keys.length = lastIndex;
	        // If we crash here, keys will be one shorter than values.
	        values.length = lastIndex;
	        return true;
	      }
	    }

	    return Object.create(OurWeakMap.prototype, {
	      get___:    { value: constFunc(get___) },
	      has___:    { value: constFunc(has___) },
	      set___:    { value: constFunc(set___) },
	      delete___: { value: constFunc(delete___) }
	    });
	  };

	  OurWeakMap.prototype = Object.create(Object.prototype, {
	    get: {
	      /**
	       * Return the value most recently associated with key, or
	       * opt_default if none.
	       */
	      value: function get(key, opt_default) {
	        return this.get___(key, opt_default);
	      },
	      writable: true,
	      configurable: true
	    },

	    has: {
	      /**
	       * Is there a value associated with key in this WeakMap?
	       */
	      value: function has(key) {
	        return this.has___(key);
	      },
	      writable: true,
	      configurable: true
	    },

	    set: {
	      /**
	       * Associate value with key in this WeakMap, overwriting any
	       * previous association if present.
	       */
	      value: function set(key, value) {
	        return this.set___(key, value);
	      },
	      writable: true,
	      configurable: true
	    },

	    'delete': {
	      /**
	       * Remove any association for key in this WeakMap, returning
	       * whether there was one.
	       *
	       * <p>Note that the boolean return here does not work like the
	       * {@code delete} operator. The {@code delete} operator returns
	       * whether the deletion succeeds at bringing about a state in
	       * which the deleted property is absent. The {@code delete}
	       * operator therefore returns true if the property was already
	       * absent, whereas this {@code delete} method returns false if
	       * the association was already absent.
	       */
	      value: function remove(key) {
	        return this.delete___(key);
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  if (typeof HostWeakMap === 'function') {
	    (function() {
	      // If we got here, then the platform has a WeakMap but we are concerned
	      // that it may refuse to store some key types. Therefore, make a map
	      // implementation which makes use of both as possible.

	      // In this mode we are always using double maps, so we are not proxy-safe.
	      // This combination does not occur in any known browser, but we had best
	      // be safe.
	      if (doubleWeakMapCheckSilentFailure && typeof Proxy !== 'undefined') {
	        Proxy = undefined;
	      }

	      function DoubleWeakMap() {
	        if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
	          calledAsFunctionWarning();
	        }

	        // Preferable, truly weak map.
	        var hmap = new HostWeakMap();

	        // Our hidden-property-based pseudo-weak-map. Lazily initialized in the
	        // 'set' implementation; thus we can avoid performing extra lookups if
	        // we know all entries actually stored are entered in 'hmap'.
	        var omap = undefined;

	        // Hidden-property maps are not compatible with proxies because proxies
	        // can observe the hidden name and either accidentally expose it or fail
	        // to allow the hidden property to be set. Therefore, we do not allow
	        // arbitrary WeakMaps to switch to using hidden properties, but only
	        // those which need the ability, and unprivileged code is not allowed
	        // to set the flag.
	        //
	        // (Except in doubleWeakMapCheckSilentFailure mode in which case we
	        // disable proxies.)
	        var enableSwitching = false;

	        function dget(key, opt_default) {
	          if (omap) {
	            return hmap.has(key) ? hmap.get(key)
	                : omap.get___(key, opt_default);
	          } else {
	            return hmap.get(key, opt_default);
	          }
	        }

	        function dhas(key) {
	          return hmap.has(key) || (omap ? omap.has___(key) : false);
	        }

	        var dset;
	        if (doubleWeakMapCheckSilentFailure) {
	          dset = function(key, value) {
	            hmap.set(key, value);
	            if (!hmap.has(key)) {
	              if (!omap) { omap = new OurWeakMap(); }
	              omap.set(key, value);
	            }
	            return this;
	          };
	        } else {
	          dset = function(key, value) {
	            if (enableSwitching) {
	              try {
	                hmap.set(key, value);
	              } catch (e) {
	                if (!omap) { omap = new OurWeakMap(); }
	                omap.set___(key, value);
	              }
	            } else {
	              hmap.set(key, value);
	            }
	            return this;
	          };
	        }

	        function ddelete(key) {
	          var result = !!hmap['delete'](key);
	          if (omap) { return omap.delete___(key) || result; }
	          return result;
	        }

	        return Object.create(OurWeakMap.prototype, {
	          get___:    { value: constFunc(dget) },
	          has___:    { value: constFunc(dhas) },
	          set___:    { value: constFunc(dset) },
	          delete___: { value: constFunc(ddelete) },
	          permitHostObjects___: { value: constFunc(function(token) {
	            if (token === weakMapPermitHostObjects) {
	              enableSwitching = true;
	            } else {
	              throw new Error('bogus call to permitHostObjects___');
	            }
	          })}
	        });
	      }
	      DoubleWeakMap.prototype = OurWeakMap.prototype;
	      module.exports = DoubleWeakMap;

	      // define .constructor to hide OurWeakMap ctor
	      Object.defineProperty(WeakMap.prototype, 'constructor', {
	        value: WeakMap,
	        enumerable: false,  // as default .constructor is
	        configurable: true,
	        writable: true
	      });
	    })();
	  } else {
	    // There is no host WeakMap, so we must use the emulation.

	    // Emulated WeakMaps are incompatible with native proxies (because proxies
	    // can observe the hidden name), so we must disable Proxy usage (in
	    // ArrayLike and Domado, currently).
	    if (typeof Proxy !== 'undefined') {
	      Proxy = undefined;
	    }

	    module.exports = OurWeakMap;
	  }
	})();


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	var Messenger, MessageDispatcher, MessageFactory, MaxRequestRetryExceedError,
	    WeakMap, events, intherits, PRIVATE;

	WeakMap = __webpack_require__(4);
	events = __webpack_require__(3);
	inherits = __webpack_require__(2);
	MessageFactory = __webpack_require__(6);
	MessageDispatcher = __webpack_require__(44);

	PRIVATE = new WeakMap();

	/** 
	 * A message has been received. The message is not an awaited response 
	 * to a request sent with {@link Messenger#sendRequest}.
	 * @event Messenger#message
	 * @type {Message}
	 */

	 /** 
	 * A request message has been received. The message is not an awaited response 
	 * to a request sent with {@link Messenger#sendRequest}.
	 * @event Messenger#request
	 * @type {Message}
	 */


	/**
	 * @class Messenger
	 * 
	 * @classdesc ...
	 * 
	 * @example <caption>Example 1.: Get an instance of Messenger</caption>
	 * 
	 * var Messenger, MessagingAdapter,
	 *     messenger, adapter;
	 * 
	 * Messenger = require("Messenger");
	 * MessagingAdapter = require("MqttMessagingAdapter");
	 * 
	 * adapter = new MessagingAdapter("192.168.60.200", 8123, "device1");
	 * messenger = new Messenger(adapter);
	 * 
	 * @example <caption>Example 2.: Send a request message for which a response is expected</caption>
	 *
	 * // Assume we already have created an instance of Messenger (Example 1.)
	 * 
	 * var MessageFactory, MessageIdGenerator, 
	 *     request, reqChannel, respChannel;
	 * 
	 * MessageFactory = require("MessageFactory");
	 * MessageIdGenerator = require("MessageIdGenerator");
	 * 
	 * reqChannel = "sessions/123/REQ";
	 * respChannel = "sessions/123/RESP";
	 * 
	 * request = MessageFactory.create(
	 *     "JoinREQ",
	 *     "session1",
	 *     "device1",
	 *     respChannel,
	 *     MessageIdGenerator.getNewId(),
	 *     "0.0.1"
	 * );
	 * 
	 * messenger.listen(respChannel);
	 * messenger.sendRequest(message, reqChannel, handleResponse, {
	 * 
	 *     // A response is expected within 1500 miliseconds
	 *     responseTimeoutMS: 1500
	 * 
	 *     // Messenger shall retry 2 times, if a response is not received within the timeout
	 *     maxRetry: 2,
	 * 
	 *     // Call this handler after 3 failed send attemps
	 *     onMaxRetryFailed: handleRetryFailed
	 * });
	 * 
	 * function handleResponse (response) {
	 *     // Do something
	 * }
	 * 
	 * function handleRetryFailed (error) {
	 *     // Do something, e.g. display a message to the user
	 * }
	 * 
	 * @example <caption>Example 3.: Send and receive messages, receive requests</caption>
	 * 
	 * // Assume we already have created a message and defined a 
	 * // message channel (Example 2.). Also we have retrieved a 
	 * // Messenger instance (Example 1.)
	 * 
	 * messenger.on("message", handleMessage);
	 * messenger.on("request", handleRequest);
	 * messenger.send(message, channel);
	 * 
	 * function handleMessage (message) {
	 *     // Do something with the message
	 * }
	 * 
	 * function handleRequest (request) {
	 *     // Process request and send a response message to:
	 *     // 'request.responseChannel'
	 * }
	 * 
	 * @constructor
	 * @param {MessagingAdapter}
	 */
	Messenger = function (messagingAdapter) {
	    PRIVATE.set(this, {
	        dispatcher: new MessageDispatcher(),
	        client: messagingAdapter
	    });
	    messagingAdapter.on("message", handleMessage.bind(this));
	};

	inherits(Messenger, events);


	function handleMessage (message) {

	    message = MessageFactory.deserialise(message);
	    
	    if (PRIVATE.get(this).dispatcher.call(message)) {
	        // Passed message to response handler; no further action required
	    }

	    else if (message.hasOwnProperty("responseChannel")) {
	        this.emit("request", message);
	    }
	    
	    else {
	        this.emit("message", message);
	    }
	}

	Messenger.prototype.getClientId = function () {
	    PRIVATE.get(this).client.getClientId();
	};

	/**
	 * Sends a message to a given channel
	 * 
	 * @param {Message} message Message object
	 * @param {string} channel
	 * @param {object} options send options such as delivery guarantees, retain
	 * @param {number} options.qos 0 - at most once, 1 - at least once, 2 - exactly once
	 * @param {boolean} options.retain retain message copy in channel for clients joining after the send.
	 */
	Messenger.prototype.send = function (message, channel, options) {
	    PRIVATE.get(this).client.send(message.serialise(), channel, options);
	};

	/**
	 * @callback Messenger~handleResponse
	 * @param {Message} response
	 */

	 /**
	  * @callback Messenger~onMaxRetryFailed
	  * @param {Messenger~MaxRequestRetryExceedError} timeoutError
	  */

	/**
	 * Sends a message to a given channel, expecting a response within a given time span.
	 * 
	 * @param {Message} message Message object
	 * @param {string} channel
	 * @param {Messenger~handleResponse} handleResponse The callback that handles the response
	 * @param {object} [options]
	 * @param {number} [options.maxRetry=0] Number of attempts to resend message after response timeout expired
	 * @param {number} [options.responseTimeoutMS=1000] Timeframe within a response to a message is expected
	 * @param {Messenger~onMaxRetryFailed} [options.onMaxRetryFailed=no op.] Handler to be called after maxRetry requests
	 *      have not been responded to within responseTimeoutMS miliseconds.
	 * @param {boolean} [options.updates=false] Expect multiple responses which update there precursors
	 */
	Messenger.prototype.sendRequest = function (message, channel, handleResponse, options) {
	    
	    var opt;
	    opt = options || {};
	    opt.maxRetry = opt.maxRetry || 0;
	    opt.responseTimeoutMS = opt.responseTimeoutMS || 2000;
	    opt.updates = opt.updates || false;
	    opt.onMaxRetryFailed = opt.onMaxRetryFailed || function () {}; 

	    retry.call(this, message, channel, opt, 0, handleResponse);
	};

	function retry (message, channel, options, numRetry, handleResponse) {

	    var priv, error;
	    
	    priv = PRIVATE.get(this);

	    if (numRetry <= options.maxRetry) {
	        
	        priv.dispatcher.set(
	            message,
	            handleResponse,
	            retry.bind(this, message, channel, options, ++numRetry, handleResponse),
	            options.responseTimeoutMS,
	            !options.updates
	        );

	        priv.client.send(message.serialise(), channel);
	    } 
	    
	    else {
	        options.onMaxRetryFailed(new MaxRequestRetryExceedError(message, channel, numRetry));
	    }
	}

	/**
	 * Start listening for messages to a given channel.
	 * 
	 * @param {string} channel
	 * 
	 * @fires Messenger#message
	 * @fires Messenger#request
	 */
	Messenger.prototype.listen = function (channel) {
	    PRIVATE.get(this).client.listen(channel);
	};

	/**
	 * Stop listening for messages to a given channel.
	 * 
	 * @param {string} channel
	 */
	Messenger.prototype.stopListen = function (channel) {
	    PRIVATE.get(this).client.stopListen(channel);
	};

	/**
	 * Stop listening all subscribed channels.
	 */
	Messenger.prototype.stopListenAll = function () {
	    PRIVATE.get(this).client.stopListenAll();
	}

	/**
	 * Terminates connection of adapter.
	 */
	Messenger.prototype.disconnect = function () {
	    PRIVATE.get(this).client.disconnect();
	}

	/**
	 * Send a broadcast message.
	 * 
	 * @param {string} message
	 * @param {string} broadcastChannel
	 */
	Messenger.prototype.broadcast = function (message, channel) {
	    PRIVATE.get(this).client.send(message, channel);
	};


	/**
	 * @typedef {Error} Messenger~MaxRequestRetryExceedError
	 * @property {string} name Name of the error
	 * @property {string} message Human readable error message
	 * @property {Message} requestMessage Original request message
	 * @property {string} requestChannel Channel to which the request was send
	 */
	MaxRequestRetryExceedError = function (message, channel, numRetry) {
	    this.name = "MaxRequestRetryExceedError";
	    this.message = "Saw no response to any of " + numRetry + " requests.";
	    this.requestMessage = message;
	    this.requestChannel = channel;
	};

	inherits(MaxRequestRetryExceedError, Error);


	module.exports = Messenger;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	var Messages = requireAll(__webpack_require__(7)),
	    constructor = {};


	function requireAll(requireContext) {
	    return requireContext.keys().map(requireContext);
	}

	Messages.forEach(function (m) {
	    if (m.hasOwnProperty("type")) {
	        constructor[m["type"]] = m;
	    }
	});

	function deserialise (jsonString) {
	    var obj = JSON.parse(jsonString);
	    if (obj && obj.type && constructor.hasOwnProperty(obj.type)) {
	        return constructor[obj.type].deserialise(jsonString);
	    } else {
	        throw "Unknown message type";
	    }
	}

	function create () {
	    var args = argsToArray(arguments).slice(1);
	    if (constructor.hasOwnProperty(arguments[0])) {
	        return new (Function.prototype.bind.apply(constructor[arguments[0]], [null].concat(args)));
	    } else {
	        throw "Unknown message type";
	    }
	}

	function argsToArray (args) {
	    var i, arr;
	    i = 0;
	    arr = [];
	    for (; i < args.length; i++) {
	        arr.push(args[i]);
	    }
	    return arr;
	}

	/**
	 * @module
	 * @name MessageFactory
	 * @description Creates Message objects.
	 * 
	 * @example
	 * // Create JoinREQ message
	 * joinreq = MessageFactory.create("JoinREQ", "ses1", "dvc1", "sessions/123/REQ", "msg1", "v1");
	 *
	 * // Deserialise JoinRESP message
	 * joinresp = MessageFactory.deserialise('{"type":"JoinRESP","sessionId":"ses1","responseCode":0,"wallclockUrl":"ws://172.19.0.1:6676","sessionSyncControllerUrl":"ws://sessionsynccontroller.example.com","id":"msg1","version":"v1"}');
	 */
	module.exports = {

	    /**
	     * Creates a message object.
	     * @function
	     * @param {string} type Message type
	     * @param {*} parameters Arguments passed to the constructor
	     * @returns {Message}
	     */
	    create: create,

	    /**
	     * Creates a message object from its JSON string representation.
	     * @function
	     * @param {string} jsonString
	     * @returns {Message}
	     */
	    deserialise: deserialise
	}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var map = {
		"./ContentIdChange.js": 8,
		"./ContextREQ.js": 12,
		"./ContextRESP.js": 14,
		"./DeviceREQ.js": 16,
		"./DeviceRESP.js": 17,
		"./DeviceStatus.js": 18,
		"./JoinREQ.js": 19,
		"./JoinRESP.js": 20,
		"./LeaveREQ.js": 21,
		"./LeaveRESP.js": 22,
		"./Message.js": 9,
		"./MessageParams.js": 10,
		"./ParameterList.js": 11,
		"./PingREQ.js": 23,
		"./PingRESP.js": 24,
		"./REQParams.js": 13,
		"./RESPParams.js": 15,
		"./StopTimelineUpdateREQ.js": 25,
		"./SyncTimelinesAvailable.js": 26,
		"./SyncTimelinesRESP.js": 27,
		"./TimelineDeRegistrationREQ.js": 28,
		"./TimelineDeRegistrationRESP.js": 29,
		"./TimelineEndSubscriptionREQ.js": 30,
		"./TimelineEndSubscriptionRESP.js": 31,
		"./TimelineInfo.js": 32,
		"./TimelineQuery.js": 33,
		"./TimelineREQ.js": 34,
		"./TimelineRESP.js": 35,
		"./TimelineRegistrationREQ.js": 36,
		"./TimelineRegistrationRESP.js": 37,
		"./TimelineSubscriptionREQ.js": 38,
		"./TimelineSubscriptionRESP.js": 39,
		"./TimelineUpdate.js": 40,
		"./TimelineUpdateREQ.js": 41,
		"./TimelineUpdateRESP.js": 42,
		"./UnexpectedDeviceExit.js": 43
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 7;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    MessageParams = __webpack_require__(10),
	    params, ContentIdChange;

	/**
	 * @constructor
	 * @name ContentIdChange
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId Identfier of the device that sent this message
	 * @param {string} contentId Unique identifier for a piece of content
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	params = MessageParams().extend([
	    { name: "deviceId", type: "string", writable: false, optional: false },
	    { name: "contentId", type: "string", writable: false, optional: false }
	]).get();

	ContentIdChange = function () { Message.call(this, ContentIdChange.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof ContentIdChange
	 * @param {string} messageString JSON representation of the message
	 * @returns {ContentIdChange} Message object
	 */
	ContentIdChange.deserialise = Message.deserialise.bind(null, ContentIdChange, params);
	ContentIdChange.type = "ContentIdChange";
	inherits(ContentIdChange, Message);

	module.exports = ContentIdChange;

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	var Message;

	/**
	 * @constructor
	 * @name Message
	 * @param {string} type
	 * @param {arguments} args
	 * @param {ParamenterList} params
	 */
	Message = function (type, args, params) {
	    args = prependToArgs(type, args);
	    checkArgs(args, params);
	    defineProperties(this, args, params);
	    return this;
	};

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @memberof Message
	 * @returns {string} JSON string representation of the message 
	 */
	Message.prototype.serialise = function () {
	    return JSON.stringify(this);
	};

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @memberof Message
	 * @param {string} messageString JSON representation of the message
	 * @returns {Message} Message object
	 */
	Message.deserialise = function (Class, params, data) {
	    var args = [];
	    data = JSON.parse(data);
	    params.forEach(function (param) {
	        var val = getFrom(data, param.name);
	        if (param.name !== "type") {
	            args.push(val);
	        } else if (val !== Class.type) {
	            throw "'" + Class.type + "' cannot deserialise Message of type '" + val + "'"
	        }
	    });
	    return new (Function.prototype.bind.apply(Class, [null].concat(args)));
	};

	function prependToArgs (arg, args) {
	    var i = 0, ar = [];
	    for (; i < args.length; i++) {
	        ar.push(args[i]);
	    }
	    return [arg].concat(ar);
	}

	function defineProperties (obj, vals, defs) {
	    var i = 0;
	    for (; i < vals.length; i++) {
	        Object.defineProperty(obj, defs[i].name, { enumerable: true, value: vals[i], writable: defs[i].writable || false });
	    };
	    for (; i < defs.length; i++) {
	        Object.defineProperty(obj, defs[i].name, { enumerable: true, value: defs[i].default, writable: defs[i].writable || false });
	    }
	}

	function checkArgs (args, expected) {
	    var i = 0, minParams = countMandatoryParams(expected);
	    if (args.length < minParams) { throw "Expected minimum of " + minParams + " arguments. Saw " + args.length + " instead."; }
	    for (; i < args.length; i++) {
	        if (typeof args[i] !== expected[i].type && args[i] !== null) {
	            throw "Expected' " + expected[i].name + "' to be of type '" + expected[i].type + "', instead: '" + typeof args[i] + "'"
	        }
	    }
	}

	function countMandatoryParams (params) {
	    var i = 0, count = 0;
	    for (; i < params.length; i++) {
	        if (!params[i].optional) { count++; }
	    }
	    return count;
	}

	function getFrom (data, prop) {
	    if (data.hasOwnProperty(prop)) {
	        return data[prop];
	    } else {
	        throw "Property '" + prop + "' not defined";
	    }
	};


	module.exports = Message;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	var ParameterList = __webpack_require__(11);

	/**
	 * @constructor
	 * @name MessageParams
	 * @augments ParameterList 
	 * @param {string} type Specifies the message type
	 * @param {string} sessionId Specifies the session
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	module.exports = function () {
	    return new ParameterList([
	        { name: "type", type: "string", writable: false, optional: false },
	        { name: "sessionId", type: "string", writable: false, optional: false },
	        { name: "id", type: "string", writable: false, optional: true, default: null },
	        { name: "version", type: "string", writable: false, optional: true, default: "0.0.1" }
	    ]);
	};


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	var ParameterList,
	    WeakMap = __webpack_require__(4),
	    PRIVATE = new WeakMap();

	/**
	 * @constructor
	 * @name ParameterList
	 */
	ParameterList = function (params) {
	    var priv;
	    PRIVATE.set(this, {});
	    priv = PRIVATE.get(this);
	    priv.mandatory = [];
	    priv.optional = [];
	    this.extend(params);
	}

	/**
	 * @typedef {object} Parameter
	 * @property {string} name Name of this parameter
	 * @property {string} type Type of this parameter
	 * @property {boolean} writable Specifies if value of this parameter can be changed
	 * @property {boolean} optional Specifies if this parameter is optional
	 * @property {string} [default] Specifies default value for optional parameter
	 */

	/**
	 * @function
	 * @memberof ParameterList
	 * @param {Parameter[]} params Array of Parameter objects
	 */
	ParameterList.prototype.extend = function (params) {
	    var priv = PRIVATE.get(this);
	    params.forEach(function (param) {
	        if (!param.optional) {
	            priv.mandatory.push(param);
	        } else {
	            priv.optional.push(param);
	        }
	    });
	    return this;
	}

	/**
	 * @function
	 * @memberof ParameterList
	 * @returns {Parameter[]} Array of Parameter objects
	 */
	ParameterList.prototype.get = function () {
	    var priv = PRIVATE.get(this);
	    return priv.mandatory.concat(priv.optional);
	};

	module.exports = ParameterList;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params = REQParams().get(),
	    ContextREQ;

	/**
	 * @constructor
	 * @name ContextREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	ContextREQ = function () { Message.call(this, ContextREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof ContextREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {ContextREQ} Message object
	 */
	ContextREQ.deserialise = Message.deserialise.bind(null, ContextREQ, params);
	ContextREQ.type = "ContextREQ";
	inherits(ContextREQ, Message);

	module.exports = ContextREQ;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	var MessageParams = __webpack_require__(10);

	/**
	 * @constructor
	 * @name REQParams
	 * @augments MessageParams
	 * @param {string} type Specifies the message type
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Name of the channel to which the resonse is to be sent
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	module.exports = function () {
	    return MessageParams().extend([
	        { name: "contextId", type: "string", writable: false, optional: false },
	        { name: "deviceId", type: "string", writable: false, optional: false },
	        { name: "responseChannel", type: "string", writable: false, optional: false }
	    ]);
	};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, ContextRESP;

	params = RESPParams().extend([
	    { name: "contexts", type: "object", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name ContextRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string[]} contexts Array of URN strings identifying contexts
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	ContextRESP = function () { Message.call(this, ContextRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof ContextRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {ContextRESP} Message object
	 */
	ContextRESP.deserialise = Message.deserialise.bind(null, ContextRESP, params);
	ContextRESP.type = "ContextRESP";
	inherits(ContextRESP, Message);

	module.exports = ContextRESP;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	var MessageParams = __webpack_require__(10);

	/**
	 * @constructor
	 * @name RESParams
	 * @augments MessageParams
	 * @param {string} type Specifies the message type
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	module.exports = function () {
	    return MessageParams().extend([
	        { name: "responseCode", type: "number", writable: false, optional: false }
	    ]);
	}


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params = REQParams().get(),
	    DeviceREQ;

	/**
	 * @constructor
	 * @name DeviceREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	DeviceREQ = function () { Message.call(this, DeviceREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof DeviceREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {DeviceREQ} Message object
	 */
	DeviceREQ.deserialise = Message.deserialise.bind(null, DeviceREQ, params);
	DeviceREQ.type = "DeviceREQ";
	inherits(DeviceREQ, Message);

	module.exports = DeviceREQ;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, DeviceRESP;

	params = RESPParams().extend([
	    { name: "devices", type: "object", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name DeviceRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string[]} devices Array of URN strings identifying devices
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	DeviceRESP = function () { Message.call(this, DeviceRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof DeviceRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {DeviceRESP} Message object
	 */
	DeviceRESP.deserialise = Message.deserialise.bind(null, DeviceRESP, params);
	DeviceRESP.type = "DeviceRESP";
	inherits(DeviceRESP, Message);

	module.exports = DeviceRESP;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	Message = __webpack_require__(9),
	MessageParams = __webpack_require__(10),
	params, DeviceStatus;

	params = MessageParams().extend([
	{ name: "deviceId", type: "string", writable: false, optional: false },
	{ name: "status", type: "string", writable: false, optional: false },
	{ name: "contextId", type: "string", writable: false, optional: true, default: null }

	]).get();

	/**
	* @constructor
	* @name DeviceStatus
	* @augments Message
	* @param {string} sessionId Specifies the session
	* @param {string} deviceId ID of the device that sent this message
	* @param {string} status one of these { "online", "offline", "publishing_timeline" }
	* @param {string} [id=null] Unique identifier for this message
	* @param {string} [version="0.0.1"] Version of the message API
	* @param {string} [contextId=null]
	*/
	DeviceStatus = function () { Message.call(this, DeviceStatus.type, arguments, params); };

	/**
	* Transforms the message to JSON string
	* @function
	* @override
	* @memberof UnexpectedDeviceExit
	* @param {string} messageString JSON representation of the message
	* @returns {UnexpectedDeviceExit} Message object
	*/
	DeviceStatus.deserialise = Message.deserialise.bind(null, DeviceStatus, params);
	DeviceStatus.type = "DeviceStatus";
	inherits(DeviceStatus, Message);

	module.exports = DeviceStatus;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params,
	    JoinREQ;

	params = REQParams().extend([
	    { name: "requestChannel", type: "string", writable: false, optional: false },
	    { name: "syncTLStrategy", type: "number", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name JoinREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} requestChannel Receiver of this message shall send requests to this channel
	 * @param {number} syncTLStrategy
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	JoinREQ = function () { Message.call(this, JoinREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof JoinREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {JoinREQ} Message object
	 */
	JoinREQ.deserialise = Message.deserialise.bind(null, JoinREQ, params);
	JoinREQ.type = "JoinREQ";
	inherits(JoinREQ, Message);

	module.exports = JoinREQ;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, JoinRESP;

	params = RESPParams().extend([
	    { name: "wallclockUrl", type: "string", writable: false, optional: false },
	    { name: "sessionSyncControllerUrl", type: "string", writable: false, optional: false },
	    { name: "rateLimit", type: "object", writable: false, optional: true, default: { numUpdates: 10, interval: 5 } }
	]).get();

	/**
	 * @constructor
	 * @name JoinRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} wallclockUrl URL which points to the wallclock service.
	 * @param {string} sessionSyncController URL which points to the session-controller service.
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 * @param {object} [rateLimit] Limit the rate of timeline updates per time interval and timeline
	 * @param {number} [rateLimit.numUpdates=10] Number of timeline updates per time interval
	 * @param {number} [rateLimit.interval=5] Size of the time interval in seconds
	 */
	JoinRESP = function () { Message.call(this, JoinRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof JoinRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {JoinRESP} Message object
	 */
	JoinRESP.deserialise = Message.deserialise.bind(null, JoinRESP, params);
	JoinRESP.type = "JoinRESP";
	inherits(JoinRESP, Message);

	module.exports = JoinRESP;


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params = REQParams().get(),
	    LeaveREQ;

	/**
	 * @constructor
	 * @name LeaveREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	LeaveREQ = function () { Message.call(this, LeaveREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof LeaveREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {LeaveREQ} Message object
	 */
	LeaveREQ.deserialise = Message.deserialise.bind(null, LeaveREQ, params);
	LeaveREQ.type = "LeaveREQ";
	inherits(LeaveREQ, Message);

	module.exports = LeaveREQ;


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params = RESPParams().get(),
	    LeaveRESP;

	/**
	 * @constructor
	 * @name LeaveRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	LeaveRESP = function () { Message.call(this, LeaveRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof LeaveREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {LeaveREQ} Message object
	 */
	LeaveRESP.deserialise = Message.deserialise.bind(null, LeaveRESP, params);
	LeaveRESP.type = "LeaveRESP";
	inherits(LeaveRESP, Message);

	module.exports = LeaveRESP;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	Message = __webpack_require__(9),
	REQParams = __webpack_require__(13),
	params = REQParams().get(),
	PingREQ;

	/**
	* @constructor
	* @name PingREQ
	* @augments Message
	* @param {string} sessionId Specifies the session
	* @param {string} contextId Identfies the devices context
	* @param {string} deviceId ID of the device that sent this message
	* @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	* @param {string} [id=null] Unique identifier for this message
	* @param {string} [version="0.0.1"] Version of the message API
	*/
	PingREQ = function () { Message.call(this, PingREQ.type, arguments, params); };

	/**
	* Transforms the message to JSON string
	* @function
	* @override
	* @memberof PingREQ
	* @param {string} messageString JSON representation of the message
	* @returns {PingREQ} Message object
	*/
	PingREQ.deserialise = Message.deserialise.bind(null, PingREQ, params);
	PingREQ.type = "PingREQ";
	inherits(PingREQ, Message);

	module.exports = PingREQ;


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params = RESPParams().get(),
	    PingRESP;

	/**
	* @constructor
	* @name PingRESP
	* @augments Message
	* @param {string} sessionId Specifies the session
	* @param {number} responseCode Specifies if server process succeeded or failed
	* @param {string} [id=null] Unique identifier for this message
	* @param {string} [version="0.0.1"] Version of the message API
	*/
	PingRESP = function () { Message.call(this, PingRESP.type, arguments, params); };

	/**
	* Transforms the message to JSON string
	* @function
	* @override
	* @memberof LeaveREQ
	* @param {string} messageString JSON representation of the message
	* @returns {LeaveREQ} Message object
	*/
	PingRESP.deserialise = Message.deserialise.bind(null, PingRESP, params);
	PingRESP.type = "PingRESP";
	inherits(PingRESP, Message);

	module.exports = PingRESP;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	Message = __webpack_require__(9),
	REQParams = __webpack_require__(13),
	params, StopTimelineUpdateREQ;

	params = REQParams().extend([
	{ name: "timelineId", type: "string", writable: false, optional: false },
	{ name: "timelineType", type: "string", writable: false, optional: false },
	{ name: "contentId", type: "string", writable: false, optional: false }
	]).get();

	/**
	* @constructor
	* @name StopTimelineUpdateREQ
	* @augments Message
	* @param {string} sessionId Specifies the session
	* @param {string} contextId Identfies the devices context
	* @param {string} deviceId ID of the device that sent this message
	* @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	* @param {string} timelineId Unique identifier for this timeline
	* @param {string} timelineType Unique identifi for the timeline type
	* @param {string} contentId Unique identifier for a piece of content
	* @param {string} [id=null] Unique identifier for this message
	* @param {string} [version="0.0.1"] Version of the message API
	*/
	StopTimelineUpdateREQ = function () { Message.call(this, StopTimelineUpdateREQ.type, arguments, params); };

	/**
	* Transforms the message to JSON string
	* @function
	* @override
	* @memberof StopTimelineUpdateREQ
	* @param {string} messageString JSON representation of the message
	* @returns {StopTimelineUpdateREQ} Message object
	*/
	StopTimelineUpdateREQ.deserialise = Message.deserialise.bind(null, StopTimelineUpdateREQ, params);
	StopTimelineUpdateREQ.type = "StopTimelineUpdateREQ";
	inherits(StopTimelineUpdateREQ, Message);

	module.exports = StopTimelineUpdateREQ;


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    MessageParams = __webpack_require__(10),
		params, SyncTimelinesAvailable;

	params = MessageParams().extend([
	    { name: "timelineInfo", type: "object", writable: false, optional: false },
	]).get();

	/**
	 * @constructor
	 * @name SyncTimelinesAvailable
	 
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {TimelineInfo[]} timelineInfo 
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	SyncTimelinesAvailable = function () { Message.call(this, SyncTimelinesAvailable.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof SyncTimelinesAvailable
	 
	 * @param {string} messageString JSON representation of the message
	 * @returns {SyncTimelinesAvailable}
	 } Message object
	 */
	SyncTimelinesAvailable.deserialise = Message.deserialise.bind(null, SyncTimelinesAvailable, params);
	SyncTimelinesAvailable.type = "SyncTimelinesAvailable";
	inherits(SyncTimelinesAvailable, Message);

	module.exports = SyncTimelinesAvailable;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, SyncTimelinesRESP;

	params = RESPParams().extend([
	    { name: "timelineInfo", type: "object", writable: false, optional: false },
	]).get();

	/**
	 * @constructor
	 * @name SyncTimelinesRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {TimelineInfo[]} timelineInfo 
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	SyncTimelinesRESP = function () { Message.call(this, SyncTimelinesRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof SyncTimelinesAvailable
	 * @param {string} messageString JSON representation of the message
	 * @returns {SyncTimelinesAvailable} Message object
	 */
	SyncTimelinesRESP.deserialise = Message.deserialise.bind(null, SyncTimelinesRESP, params);
	SyncTimelinesRESP.type = "SyncTimelinesRESP";
	inherits(SyncTimelinesRESP, Message);

	module.exports = SyncTimelinesRESP;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineDeRegistrationREQ;

	params = REQParams().extend([
	    { name: "timelineId", type: "string", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineDeRegistrationREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} timelineId Unique identifier for timeline
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineDeRegistrationREQ = function () { Message.call(this, TimelineDeRegistrationREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineDeRegistrationREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineDeRegistrationREQ} Message object
	 */
	TimelineDeRegistrationREQ.deserialise = Message.deserialise.bind(null, TimelineDeRegistrationREQ, params);
	TimelineDeRegistrationREQ.type = "TimelineDeRegistrationREQ";
	inherits(TimelineDeRegistrationREQ, Message);

	module.exports = TimelineDeRegistrationREQ;


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params = RESPParams().get(),
	    TimelineDeRegistrationRESP;

	/**
	 * @constructor
	 * @name TimelineDeRegistrationRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineDeRegistrationRESP = function () { Message.call(this, TimelineDeRegistrationRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineDeRegistrationRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineDeRegistrationRESP} Message object
	 */
	TimelineDeRegistrationRESP.deserialise = Message.deserialise.bind(null, TimelineDeRegistrationRESP, params);
	TimelineDeRegistrationRESP.type = "TimelineDeRegistrationRESP";
	inherits(TimelineDeRegistrationRESP, Message);

	module.exports = TimelineDeRegistrationRESP;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineEndSubscriptionREQ;

	params = REQParams().extend([
	    { name: "timelineId", type: "string", writable: false, optional: false }
	]).get()

	/**
	 * @constructor
	 * @name TimelineEndRegistrationREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} timelineId Unique identifier for timeline
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineEndSubscriptionREQ = function () { Message.call(this, TimelineEndSubscriptionREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineEndRegistrationREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineEndRegistrationREQ} Message object
	 */
	TimelineEndSubscriptionREQ.deserialise = Message.deserialise.bind(null, TimelineEndSubscriptionREQ, params);
	TimelineEndSubscriptionREQ.type = "TimelineEndSubscriptionREQ";
	inherits(TimelineEndSubscriptionREQ, Message);

	module.exports = TimelineEndSubscriptionREQ;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params = RESPParams().get(),
	    TimelineEndSubscriptionRESP;

	/**
	 * @constructor
	 * @name TimelineEndSubscriptionRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineEndSubscriptionRESP = function () { Message.call(this, TimelineEndSubscriptionRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineEndSubscriptionRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineEndSubscriptionRESP} Message object
	 */
	TimelineEndSubscriptionRESP.deserialise = Message.deserialise.bind(null, TimelineEndSubscriptionRESP, params);
	TimelineEndSubscriptionRESP.type = "TimelineEndSubscriptionRESP";
	inherits(TimelineEndSubscriptionRESP, Message);

	module.exports = TimelineEndSubscriptionRESP;


/***/ }),
/* 32 */
/***/ (function(module, exports) {

	/**
	 * @typedef {object} TimelineInfo
	 * @property {string} timelineId
	 * @property {string} timelineType
	 * @property {string} contentId
	 * @property {boolean} syncTimeline
	 * @property {string} providerId
	 * @property {string} providerType
	 * @property {string} providerChannel
	 */


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    MessageParams = __webpack_require__(10),
	    params, TimelineQuery;

	params = MessageParams().extend([
	    { name: "contentId", type: "string", writable: false, optional: true, default: "*" },
	    { name: "timelineType", type: "string", writable: false, optional: true, default: "*" }
	]).get();

	/**
	 * @constructor
	 * @name TimelineQuery
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contentId Unique identifier for a piece of content
	 * @param {string} timelineType URN string identifying a particular timeline type
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineQuery = function () { Message.call(this, TimelineQuery.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineQuery
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineQuery} Message object
	 */
	TimelineQuery.deserialise = Message.deserialise.bind(null, TimelineQuery, params);
	TimelineQuery.type = "TimelineQuery";
	inherits(TimelineQuery, Message);

	module.exports = TimelineQuery;


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineREQ;

	params = REQParams().extend([
	    { name: "providerContextId", type: "string", writable: false, optional: true, default: null },
	    { name: "providerId", type: "string", writable: false, optional: true, default: null },
	    { name: "timelineType", type: "string", writable: false, optional: true, default: null },
	    { name: "contentId", type: "string", writable: false, optional: true, default: null },
	    { name: "syncTimeline", type: "boolean", writable: false, optional: true, default: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineREQ
	 * @augments Message
	 * @param {string} sessionId Identifies the sender's session
	 * @param {string} contextId Identfies the sender's context
	 * @param {string} deviceId Identifies the sender of this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 * @param {string} [providerContextId=null] Identifier of the context of the provider of a timeline 
	 * @param {string} [providerId=null] Identifier of the provider of a timeline, e.g. identifier of a device in the session
	 * @param {string} [timelineType=null] URN string specifying the timeline type
	 * @param {string} [contentId=null] Unique identifier for a piece of content
	 * @param {boolean} [syncTimeline=false] Idicates, if querying session-sync timelines only
	 */
	TimelineREQ = function () { Message.call(this, TimelineREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineREQ} Message object
	 */
	TimelineREQ.deserialise = Message.deserialise.bind(null, TimelineREQ, params);
	TimelineREQ.type = "TimelineREQ";
	inherits(TimelineREQ, Message);

	module.exports = TimelineREQ;


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, TimelineRESP;

	params = RESPParams().extend([
	    { name: "timelineInfo", type: "object", writable: false, optional: false },
	]).get();

	/**
	 * @constructor
	 * @name TimelineRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {TimelineInfo[]} timelineInfo 
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineRESP = function () { Message.call(this, TimelineRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineRESP} Message object
	 */
	TimelineRESP.deserialise = Message.deserialise.bind(null, TimelineRESP, params);
	TimelineRESP.type = "TimelineRESP";
	inherits(TimelineRESP, Message);

	module.exports = TimelineRESP;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineRegistrationREQ;

	params = REQParams().extend([
	    { name: "correlation", type: "object", writable: false, optional: false },
	    { name: "timelineId", type: "string", writable: false, optional: false },
	    { name: "contentId", type: "string", writable: false, optional: false },
	    { name: "timelineType", type: "string", writable: false, optional: false },
	    { name: "frequency", type: "number", writable: false, optional: false },
	    { name: "channel", type: "string", writable: false, optional: false },
	    { name: "useForSessionSync", type: "boolean", writable: false, optional: false },
	    { name: "writable", type: "boolean", writable: false, optional: false }
	]).get();

	/**
	 * @typedef {object} Correlation
	 * @property {number} parentTime Time on the reference clock
	 * @property {number} childTime Time on this clock
	 * @property {number} initialError Intitial time error
	 * @property {number} errorGrowthRate Error groth rate
	 */

	/**
	 * @constructor
	 * @name TimelineRegistrationREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} contextId Identfies the devices context
	 * @param {Correlation} correlation ...
	 * @param {string} timelineId URN string identifying a particular timeline
	 * @param {string} contentId Unique identifier for a piece of content
	 * @param {string} timelineType URN string specifying the timeline type
	 * @param {number} frequency Number of ticks per second on this timeline
	 * @param {string} channel address for the channel to listen to for updates to this timeline
	 * @param {boolean} useForSessionSync this timeline shall be considered for synchronising the whole session by the sync controller
	 * @param {boolean} writable this timeline can be changed by an external party (e.g. sync controller):
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineRegistrationREQ = function () { Message.call(this, TimelineRegistrationREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineRegistrationREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineRegistrationREQ} Message object
	 */
	TimelineRegistrationREQ.deserialise = Message.deserialise.bind(null, TimelineRegistrationREQ, params);
	TimelineRegistrationREQ.type = "TimelineRegistrationREQ";
	inherits(TimelineRegistrationREQ, Message);

	module.exports = TimelineRegistrationREQ;

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params,
	    TimelineRegistrationRESP;

	params = RESPParams().extend([
	    { name: "timelineUpdateChannel", type: "string", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineRegistrationRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} timelineUpdateChannel
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineRegistrationRESP = function () { Message.call(this, TimelineRegistrationRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineRegistrationRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineRegistrationRESP} Message object
	 */
	TimelineRegistrationRESP.deserialise = Message.deserialise.bind(null, TimelineRegistrationRESP, params);
	TimelineRegistrationRESP.type = "TimelineRegistrationRESP";
	inherits(TimelineRegistrationRESP, Message);

	module.exports = TimelineRegistrationRESP;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineSubscriptionREQ;

	params = REQParams().extend([
	    { name: "timelineId", type: "string", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineSubscriptionREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} timelineId URN string specifying a particular timeline
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineSubscriptionREQ = function () { Message.call(this, TimelineSubscriptionREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineSubscriptionREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineSubscriptionREQ} Message object
	 */
	TimelineSubscriptionREQ.deserialise = Message.deserialise.bind(null, TimelineSubscriptionREQ, params);
	TimelineSubscriptionREQ.type = "TimelineSubscriptionREQ";
	inherits(TimelineSubscriptionREQ, Message);

	module.exports = TimelineSubscriptionREQ;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params, TimelineSubscriptionRESP;

	params = RESPParams().extend([
	    { name: "providerChannel", type: "string", writable: false, optional: false },
	    { name: "presentationTimestamp", type: "object", writable: false, optional: true, default: null }
	]).get();

	/**
	 * @typedef {object} PresentationTimestamp
	 * @property {Timestamp} earliest
	 * @property {Timestamp} actual
	 * @property {Timestamp} latest
	 */

	/**
	 * @typedef {object} Timestamp
	 * @property {number} contentTime
	 * @property {number} wallclockTime
	 * @property {number} speed
	 */

	/**
	 * @constructor
	 * @name TimelineSubscriptionRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} providerChannel MQTT topic to register to for timeline updates
	 * @param {PresentationTimestamp} [presentationTimestamp=null] if available
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineSubscriptionRESP = function () { Message.call(this, TimelineSubscriptionRESP.type, arguments, params); };
	TimelineSubscriptionRESP.deserialise = Message.deserialise.bind(null, TimelineSubscriptionRESP, params);
	TimelineSubscriptionRESP.type = "TimelineSubscriptionRESP";
	inherits(TimelineSubscriptionRESP, Message);

	module.exports = TimelineSubscriptionRESP;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    MessageParams = __webpack_require__(10),
	    params, TimelineUpdate;

	params = MessageParams().extend([
	    { name: "deviceId", type: "string", writable: false, optional: false },
	    { name: "timelineId", type: "string", writable: false, optional: false },
	    { name: "timelineType", type: "string", writable: false, optional: false },
	    { name: "contentId", type: "string", writable: false, optional: false },
	    { name: "presentationTimestamp", type: "object", writable: false, optional: false },
	    { name: "dispersionAt", type: "object", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineUpdate
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} timelineId
	 * @param {string} timelineType
	 * @param {string} contentId
	 * @param {PresentationTimestamp} presentationTimestamp ...
	 * @param {object} dispersionAt Dispersion of timeline clock for a specific point on on the timeline
	 * @param {number} dispersionAt.dispersionS Dispersion in seconds
	 * @param {number} dispersionAt.timeS Time on timeline in seconds
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineUpdate = function () { Message.call(this, TimelineUpdate.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineUpdate
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineUpdate} Message object
	 */
	TimelineUpdate.deserialise = Message.deserialise.bind(null, TimelineUpdate, params);
	TimelineUpdate.type = "TimelineUpdate";
	inherits(TimelineUpdate, Message);

	module.exports = TimelineUpdate;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    REQParams = __webpack_require__(13),
	    params, TimelineUpdateREQ;

	params = REQParams().extend([
	    { name: "timelineId", type: "string", writable: false, optional: false },
	    { name: "timelineType", type: "string", writable: false, optional: false },
	    { name: "contentId", type: "string", writable: false, optional: false }
	]).get();

	/**
	 * @constructor
	 * @name TimelineUpdateREQ
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {string} contextId Identfies the devices context
	 * @param {string} deviceId ID of the device that sent this message
	 * @param {string} responseChannel Receiver of this message shall send response(s) to this channel
	 * @param {string} timelineId Unique identifier for this timeline
	 * @param {string} timelineType Unique identifi for the timeline type
	 * @param {string} contentId Unique identifier for a piece of content
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineUpdateREQ = function () { Message.call(this, TimelineUpdateREQ.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineUpdateREQ
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineUpdateREQ} Message object
	 */
	TimelineUpdateREQ.deserialise = Message.deserialise.bind(null, TimelineUpdateREQ, params);
	TimelineUpdateREQ.type = "TimelineUpdateREQ";
	inherits(TimelineUpdateREQ, Message);

	module.exports = TimelineUpdateREQ;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
	    Message = __webpack_require__(9),
	    RESPParams = __webpack_require__(15),
	    params = RESPParams().get(),
	    TimelineUpdateRESP;

	/**
	 * @constructor
	 * @name TimelineUpdateRESP
	 * @augments Message
	 * @param {string} sessionId Specifies the session
	 * @param {number} responseCode Specifies if server process succeeded or failed
	 * @param {string} [id=null] Unique identifier for this message
	 * @param {string} [version="0.0.1"] Version of the message API
	 */
	TimelineUpdateRESP = function () { Message.call(this, TimelineUpdateRESP.type, arguments, params); };

	/**
	 * Transforms the message to JSON string
	 * @function
	 * @override
	 * @memberof TimelineUpdateRESP
	 * @param {string} messageString JSON representation of the message
	 * @returns {TimelineUpdateRESP} Message object
	 */
	TimelineUpdateRESP.deserialise = Message.deserialise.bind(null, TimelineUpdateRESP, params);
	TimelineUpdateRESP.type = "TimelineUpdateRESP";
	inherits(TimelineUpdateRESP, Message);

	module.exports = TimelineUpdateRESP;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits = __webpack_require__(2),
		Message = __webpack_require__(9),
		MessageParams = __webpack_require__(10),
		params, UnexpectedDeviceExit;

	params = MessageParams().extend([
		{ name: "contextId", type: "string", writable: false, optional: false},
		{ name: "deviceId", type: "string", writable: false, optional: false }
	]).get();

	/**
	* @constructor
	* @name UnexpectedDeviceExit
	* @augments Message
	* @param {string} sessionId Specifies the session
	* @param {string} contextId
	* @param {string} deviceId ID of the device that sent this message
	* @param {string} [id=null] Unique identifier for this message
	* @param {string} [version="0.0.1"] Version of the message API
	*/
	UnexpectedDeviceExit = function () { Message.call(this, UnexpectedDeviceExit.type, arguments, params); };

	/**
	* Transforms the message to JSON string
	* @function
	* @override
	* @memberof UnexpectedDeviceExit
	* @param {string} messageString JSON representation of the message
	* @returns {UnexpectedDeviceExit} Message object
	*/
	UnexpectedDeviceExit.deserialise = Message.deserialise.bind(null, UnexpectedDeviceExit, params);
	UnexpectedDeviceExit.type = "UnexpectedDeviceExit";
	inherits(UnexpectedDeviceExit, Message);

	module.exports = UnexpectedDeviceExit;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	var WeakMap = __webpack_require__(4),
	    PRIVATE = new WeakMap(),
	    MessageDispatcher;

	/**
	 * @class MessageDispatcher
	 * 
	 * @classdesc ...
	 * 
	 * @example
	 * var MessageFactory, MessageIdGenerator,
	 *     dispatcher, message;
	 * 
	 * MessageFactory = require("MessageFactory");
	 * MessageIdGenerator = require("MessageIdGenerator");
	 * 
	 * message = MessageFactory.create(
	 *     "JoinREQ",
	 *     "123",
	 *     "abc",
	 *     MessageIdGenerator.getNewId(),
	 *     "0.1"
	 * );
	 * 
	 * // Create instance
	 * dispatcher = new MessageDispatcher(2000);
	 * 
	 * // Add handler for responses to this message
	 * // Also add a handler for expired timeouts (time to response)
	 * dispatcher.set(message, handleResponse, handleTimeout);
	 * 
	 * function handleResponse (res) {
	 *     // Do something with the response
	 * }
	 * 
	 * function handleTimeout (res) {
	 *     // Do something, e.g. retry
	 * }
	 * 
	 * // Send message ...
	 * 
	 * // Process message and create response
	 * var response = MessageFactory.create(
	 *     "JoinRESP",
	 *     message.sessionId,
	 *     0,
	 *     "ws://wallclock.example.com:8080",
	 *     "ws://sessionsynccontroller.example.com",
	 *     message.id,
	 *     message.version
	 * );
	 * 
	 * // ... Receive response
	 * dispatcher.call(response);
	 * // --> 'handleResponse' is called
	 * 
	 * @constructor
	 * @param {number} [reponseTimeoutMS=1000] Time in miliseconds by when a response
	 *      is expected to requests
	 */
	MessageDispatcher = function (responseTimeoutMS) {
	    var priv;
	    PRIVATE.set(this, {});
	    priv = PRIVATE.get(this);
	    priv.messageMap = {};
	    priv.responseTimeout = responseTimeoutMS || 2000;
	};

	/**
	 * Sets a callback for a given message. The callback is invoked, if a message 
	 * with the same 'id' is passed to method 'call'. Callback can be fired multiple times.
	 * 
	 * @memberof MessageDispatcher
	 * @param {Message} message
	 * @param {function} onresponse Callback function to be called. In this function
	 *      this refers to the message that invoked its call, i.e. the message that
	 *      is passed to method 'call'.
	 * @param {function} [onresponsetimeout] Callback function which is called if a response has not
	 *      been received within timeoout.
	 * @param {number} [responseTimeoutMS] Timeout in miliseconds by when a response is expected.
	 *      Defaults to the value passed to the constructor.
	 */
	MessageDispatcher.prototype.set = function (message, onresponse, onresponsetimeout, responseTimeoutMS, once) {
	    
	    var priv, typeOfHandler, handleTimeout;
	    priv = PRIVATE.get(this);
	    
	    typeOfHandler = typeof onresponse;
	    if (typeOfHandler !== "function") {
	        throw new Error("Expected 'onresponse' to be of type function. Saw '" + typeOfHandler + "' instead");
	    }

	    handleTimeout = onresponsetimeout || function () {};
	    typeOfHandler = typeof handleTimeout;
	    if (typeOfHandler !== "function") {
	        throw new Error("Expected 'onresponsetimeout' to be of type function. Saw '" + typeOfHandler + "' instead");
	    }

	    priv.messageMap[message.id] = {
	        onresponse: onresponse,
	        onresponsetimeout: handleTimeout,
	        timeout: setTimeout(handleTimeoutExpired.bind(this, message.id), responseTimeoutMS || priv.responseTimeout),
	        once: once || false
	    };
	};

	/**
	 * Sets a callback for a given message. The callback is invoked, if a message 
	 * with the same 'id' is passed to method 'call'. Callback is fired only once.
	 * 
	 * @memberof MessageDispatcher
	 * @param {Message} message
	 * @param {function} onresponse Callback function to be called. In this function
	 *      this refers to the message that invoked its call, i.e. the message that
	 *      is passed to method 'call'.
	 * @param {function} [onresponsetimeout] Callback function which is called if a response has not
	 *      been received within timeoout.
	 * @param {number} [responseTimeoutMS] Timeout in miliseconds by when a response is expected.
	 *      Defaults to the value set passed to the constructor.
	 */
	MessageDispatcher.prototype.setOnce = function (message, onresponse, onresponsetimeout, responseTimeoutMS) {
	    var priv = PRIVATE.get(this);
	    this.set(message, onresponse, onresponsetimeout || function () {}, responseTimeoutMS || priv.responseTimeoutMS, true);
	}

	/**
	 * Invokes the call of the handler set with method 'set', if the 'id' property
	 * value of the message passed to call equals the 'id' of a previousely set
	 * handler.
	 * 
	 * @memberof MessageDispatcher
	 * @param {Message} message
	 * @returns {boolean} TRUE if a handler was registered for this message, else FALSE.
	 */
	MessageDispatcher.prototype.call = function (message) {
	    var priv = PRIVATE.get(this);
	    if (priv.messageMap.hasOwnProperty(message.id)) {
	        priv.messageMap[message.id].onresponse(message);
	        clearTimeout(priv.messageMap[message.id].timeout);
	        if (priv.messageMap[message.id].once === true) {
	            delete priv.messageMap[message.id];
	        }
	        return true;
	    }
	    return false;
	};

	function handleTimeoutExpired (messageId) {
	    var priv, timeoutHandler; 
	    priv = PRIVATE.get(this);
	    timeoutHandler = priv.messageMap[messageId].onresponsetimeout;
	    if (priv.messageMap.hasOwnProperty(messageId)) {
	        delete priv.messageMap[messageId];
	        timeoutHandler();
	    }
	}

	module.exports = MessageDispatcher;

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	var inherits, MessagingAdapter, WeakMap, mqtt, MqttMessagingAdapter, PRIVATE, ChannelMap, MessageFactory;

	ChannelMap = __webpack_require__(46);
	mqtt = __webpack_require__(47);
	WeakMap = __webpack_require__(4);
	MessagingAdapter = __webpack_require__(209);
	inherits = __webpack_require__(2);
	UnexpectedDeviceExit = __webpack_require__(43);

	PRIVATE = new WeakMap();


	/**
	 * @class MqttMessagingAdapter
	 * 
	 * @classdesc Messaging adapter for the 
	 * [mqtt.js mqtt client]{@link https://www.npmjs.com/package/mqtt}.
	 * 
	 * @constructor
	 * @augments MessagingAdapter
	 * 
	 * @param {string} host
	 * @param {string} port
	 * @param {string} user
	 * @param {object} [options]
	 * @param {string} [options.sessionId]
	 * @param {string} [options.contextId]
	 * 
	 * @fires MessagingAdapter#connectionlost
	 * @fires MessagingAdapter#connectionfailure
	 * @fires MessagingAdapter#connectionestablished
	 * @fires MessagingAdapter#message
	 */
	MqttMessagingAdapter = function (host, port, user, options) {

	    var priv, lastWill, opt,
	        sessionId, contextId;

	    PRIVATE.set(this, {});
	    priv = PRIVATE.get(this);

	    opt = options || {};
	    
	    sessionId = opt.sessionId || "default";
	    contextId = opt.contextId || "default";

	    priv.host = host;
	    priv.port = port;
	    priv.user = user;
	    priv.subscribedChannels = new ChannelMap();

	    lastWill = {};
	    lastWill.topic = "Sessions/lastwill";
	    lastWill.payload = new UnexpectedDeviceExit(sessionId, contextId, user).serialise();
	    lastWill.qos = 2;
	    lastWill.retain = false;

	    if (typeof port !== "undefined"){
	        priv.client = mqtt.connect({ host: host, port: port, keepalive: 60, clientId: user, will: lastWill });
	    }else
	    {
	        var url = "wss://" + host;
	        priv.client = mqtt.connect( url,  { keepalive: 60, clientId: user, will: lastWill });
	    }

	   
	    priv.client.on("connect", this.emit.bind(this, "connectionestablished"));
	    priv.client.on("error", this.emit.bind(this, "connectionfailure"));
	    priv.client.on("close", this.emit.bind(this, "connectionlost"));
	    priv.client.on("message", handleMessage.bind(this));

	};

	inherits(MqttMessagingAdapter, MessagingAdapter);


	function handleMessage (topic, message) {
	    this.emit.call(this, "message", message);
	}

	MqttMessagingAdapter.prototype.getClientId = function () {
	    return PRIVATE.get(this).client.options.clientId;
	};

	MqttMessagingAdapter.prototype.send = function (message, channel, options) {

	    var opt;
	    if (typeof options!== "undefined")
	     {
	        opt = {
	            qos: options.qos || 0,
	            retain: options.retain || false,
	            dup: options.dup || false
	        };
	        PRIVATE.get(this).client.publish(channel, message, opt);
	     }
	     else
	        PRIVATE.get(this).client.publish(channel, message);   

	};

	MqttMessagingAdapter.prototype.listen = function (channel) {
	    var priv = PRIVATE.get(this);
	    if (priv.subscribedChannels.addIfNew(channel)) {
	        priv.client.subscribe(channel);
	    }
	};

	MqttMessagingAdapter.prototype.stopListen = function (channel) {
	    if (priv.subscribedChannels.removeIfContained(channel)) {
	        PRIVATE.get(this).client.unsubscribe(channel);
	    }
	};

	MqttMessagingAdapter.prototype.stopListenAll = function () {
	    var priv, channels;
	    priv = PRIVATE.get(this);
	    channels = priv.subscribedChannels.removeAll();
	    channels.forEach(function (ch) { priv.client.unsubscribe(ch) });
	};

	MqttMessagingAdapter.prototype.disconnect = function () {
	    PRIVATE.get(this).client.end();
	};

	module.exports = MqttMessagingAdapter;

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	var ChannelMap, WeakMap, PRIVATE;

	WeakMap = __webpack_require__(4);
	PRIVATE = new WeakMap();

	/**
	 * @class ChannelMap
	 */
	ChannelMap = function () {
	    PRIVATE.set(this, {
	        map: []
	    });
	};

	/**
	 * Adds channel name if not yet in map.
	 * @param {string} channelName
	 * @returns {boolean} TRUE if new channel name added, else FALSE.
	 */
	ChannelMap.prototype.addIfNew = function (chName) {
	    var map = PRIVATE.get(this).map;
	    if (map.indexOf(chName) < 0) {
	        map.push(chName);
	        return true;
	    }
	};

	/**
	 * Removes channel name from map, if contained in map.
	 * @param {string} chName
	 * @returns {boolean} TRUE if new channel name removed, else FALSE.
	 */
	ChannelMap.prototype.removeIfContained = function (chName) {
	    var map, i;
	    map = PRIVATE.get(this).map;
	    i = map.indexOf(chName);
	    if (i > -1) {
	        map.splice(i, 1)
	        return true;
	    };
	    return false;
	};

	/**
	 * Removes all channel names from map.
	 * @returns {array<string>} List of removed channel names
	 */
	ChannelMap.prototype.removeAll = function () {
	    var map, res;
	    map = PRIVATE.get(this).map;
	    res = [].concat(map); // Copy map
	    map = [] // Clear map
	    return res;
	};

	module.exports = ChannelMap;

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict'

	var MqttClient = __webpack_require__(49)
	var Store = __webpack_require__(50)
	var url = __webpack_require__(165)
	var xtend = __webpack_require__(51)
	var protocols = {}

	if (process.title !== 'browser') {
	  protocols.mqtt = __webpack_require__(172)
	  protocols.tcp = __webpack_require__(172)
	  protocols.ssl = __webpack_require__(174)
	  protocols.tls = __webpack_require__(174)
	  protocols.mqtts = __webpack_require__(174)
	} else {
	  protocols.wx = __webpack_require__(176)
	  protocols.wxs = __webpack_require__(176)
	}

	protocols.ws = __webpack_require__(208)
	protocols.wss = __webpack_require__(208)

	/**
	 * Parse the auth attribute and merge username and password in the options object.
	 *
	 * @param {Object} [opts] option object
	 */
	function parseAuthOptions (opts) {
	  var matches
	  if (opts.auth) {
	    matches = opts.auth.match(/^(.+):(.+)$/)
	    if (matches) {
	      opts.username = matches[1]
	      opts.password = matches[2]
	    } else {
	      opts.username = opts.auth
	    }
	  }
	}

	/**
	 * connect - connect to an MQTT broker.
	 *
	 * @param {String} [brokerUrl] - url of the broker, optional
	 * @param {Object} opts - see MqttClient#constructor
	 */
	function connect (brokerUrl, opts) {
	  if ((typeof brokerUrl === 'object') && !opts) {
	    opts = brokerUrl
	    brokerUrl = null
	  }

	  opts = opts || {}

	  if (brokerUrl) {
	    var parsed = url.parse(brokerUrl, true)
	    if (parsed.port != null) {
	      parsed.port = Number(parsed.port)
	    }

	    opts = xtend(parsed, opts)

	    if (opts.protocol === null) {
	      throw new Error('Missing protocol')
	    }
	    opts.protocol = opts.protocol.replace(/:$/, '')
	  }

	  // merge in the auth options if supplied
	  parseAuthOptions(opts)

	  // support clientId passed in the query string of the url
	  if (opts.query && typeof opts.query.clientId === 'string') {
	    opts.clientId = opts.query.clientId
	  }

	  if (opts.cert && opts.key) {
	    if (opts.protocol) {
	      if (['mqtts', 'wss', 'wxs'].indexOf(opts.protocol) === -1) {
	        switch (opts.protocol) {
	          case 'mqtt':
	            opts.protocol = 'mqtts'
	            break
	          case 'ws':
	            opts.protocol = 'wss'
	            break
	          case 'wx':
	            opts.protocol = 'wxs'
	            break
	          default:
	            throw new Error('Unknown protocol for secure connection: "' + opts.protocol + '"!')
	        }
	      }
	    } else {
	      // don't know what protocol he want to use, mqtts or wss
	      throw new Error('Missing secure protocol key')
	    }
	  }

	  if (!protocols[opts.protocol]) {
	    var isSecure = ['mqtts', 'wss'].indexOf(opts.protocol) !== -1
	    opts.protocol = [
	      'mqtt',
	      'mqtts',
	      'ws',
	      'wss',
	      'wx',
	      'wxs'
	    ].filter(function (key, index) {
	      if (isSecure && index % 2 === 0) {
	        // Skip insecure protocols when requesting a secure one.
	        return false
	      }
	      return (typeof protocols[key] === 'function')
	    })[0]
	  }

	  if (opts.clean === false && !opts.clientId) {
	    throw new Error('Missing clientId for unclean clients')
	  }

	  if (opts.protocol) {
	    opts.defaultProtocol = opts.protocol
	  }

	  function wrapper (client) {
	    if (opts.servers) {
	      if (!client._reconnectCount || client._reconnectCount === opts.servers.length) {
	        client._reconnectCount = 0
	      }

	      opts.host = opts.servers[client._reconnectCount].host
	      opts.port = opts.servers[client._reconnectCount].port
	      opts.protocol = (!opts.servers[client._reconnectCount].protocol ? opts.defaultProtocol : opts.servers[client._reconnectCount].protocol)
	      opts.hostname = opts.host

	      client._reconnectCount++
	    }

	    return protocols[opts.protocol](client, opts)
	  }

	  return new MqttClient(wrapper, opts)
	}

	module.exports = connect
	module.exports.connect = connect
	module.exports.MqttClient = MqttClient
	module.exports.Store = Store

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 48 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;

	process.listeners = function (name) { return [] }

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {'use strict'

	/**
	 * Module dependencies
	 */
	var events = __webpack_require__(3)
	var Store = __webpack_require__(50)
	var eos = __webpack_require__(137)
	var mqttPacket = __webpack_require__(140)
	var Writable = __webpack_require__(52).Writable
	var inherits = __webpack_require__(2)
	var reInterval = __webpack_require__(163)
	var validations = __webpack_require__(164)
	var xtend = __webpack_require__(51)
	var setImmediate = global.setImmediate || function (callback) {
	  // works in node v0.8
	  process.nextTick(callback)
	}
	var defaultConnectOptions = {
	  keepalive: 60,
	  reschedulePings: true,
	  protocolId: 'MQTT',
	  protocolVersion: 4,
	  reconnectPeriod: 1000,
	  connectTimeout: 30 * 1000,
	  clean: true,
	  resubscribe: true
	}

	function defaultId () {
	  return 'mqttjs_' + Math.random().toString(16).substr(2, 8)
	}

	function sendPacket (client, packet, cb) {
	  client.emit('packetsend', packet)

	  var result = mqttPacket.writeToStream(packet, client.stream)

	  if (!result && cb) {
	    client.stream.once('drain', cb)
	  } else if (cb) {
	    cb()
	  }
	}

	function flush (queue) {
	  if (queue) {
	    Object.keys(queue).forEach(function (messageId) {
	      if (typeof queue[messageId] === 'function') {
	        queue[messageId](new Error('Connection closed'))
	        delete queue[messageId]
	      }
	    })
	  }
	}

	function storeAndSend (client, packet, cb) {
	  client.outgoingStore.put(packet, function storedPacket (err) {
	    if (err) {
	      return cb && cb(err)
	    }
	    sendPacket(client, packet, cb)
	  })
	}

	function nop () {}

	/**
	 * MqttClient constructor
	 *
	 * @param {Stream} stream - stream
	 * @param {Object} [options] - connection options
	 * (see Connection#connect)
	 */
	function MqttClient (streamBuilder, options) {
	  var k
	  var that = this

	  if (!(this instanceof MqttClient)) {
	    return new MqttClient(streamBuilder, options)
	  }

	  this.options = options || {}

	  // Defaults
	  for (k in defaultConnectOptions) {
	    if (typeof this.options[k] === 'undefined') {
	      this.options[k] = defaultConnectOptions[k]
	    } else {
	      this.options[k] = options[k]
	    }
	  }

	  this.options.clientId = (typeof this.options.clientId === 'string') ? this.options.clientId : defaultId()

	  this.streamBuilder = streamBuilder

	  // Inflight message storages
	  this.outgoingStore = this.options.outgoingStore || new Store()
	  this.incomingStore = this.options.incomingStore || new Store()

	  // Should QoS zero messages be queued when the connection is broken?
	  this.queueQoSZero = this.options.queueQoSZero === undefined ? true : this.options.queueQoSZero

	  // map of subscribed topics to support reconnection
	  this._resubscribeTopics = {}

	  // map of a subscribe messageId and a topic
	  this.messageIdToTopic = {}

	  // Ping timer, setup in _setupPingTimer
	  this.pingTimer = null
	  // Is the client connected?
	  this.connected = false
	  // Are we disconnecting?
	  this.disconnecting = false
	  // Packet queue
	  this.queue = []
	  // connack timer
	  this.connackTimer = null
	  // Reconnect timer
	  this.reconnectTimer = null
	  /**
	   * MessageIDs starting with 1
	   * ensure that nextId is min. 1, see https://github.com/mqttjs/MQTT.js/issues/810
	   */
	  this.nextId = Math.max(1, Math.floor(Math.random() * 65535))

	  // Inflight callbacks
	  this.outgoing = {}

	  // Mark connected on connect
	  this.on('connect', function () {
	    if (this.disconnected) {
	      return
	    }

	    this.connected = true
	    var outStore = this.outgoingStore.createStream()

	    this.once('close', remove)
	    outStore.on('end', function () {
	      that.removeListener('close', remove)
	    })
	    outStore.on('error', function (err) {
	      that.removeListener('close', remove)
	      that.emit('error', err)
	    })

	    function remove () {
	      outStore.destroy()
	      outStore = null
	    }

	    function storeDeliver () {
	      // edge case, we wrapped this twice
	      if (!outStore) {
	        return
	      }

	      var packet = outStore.read(1)
	      var cb

	      if (!packet) {
	        // read when data is available in the future
	        outStore.once('readable', storeDeliver)
	        return
	      }

	      // Avoid unnecessary stream read operations when disconnected
	      if (!that.disconnecting && !that.reconnectTimer) {
	        cb = that.outgoing[packet.messageId]
	        that.outgoing[packet.messageId] = function (err, status) {
	          // Ensure that the original callback passed in to publish gets invoked
	          if (cb) {
	            cb(err, status)
	          }

	          storeDeliver()
	        }
	        that._sendPacket(packet)
	      } else if (outStore.destroy) {
	        outStore.destroy()
	      }
	    }

	    // start flowing
	    storeDeliver()
	  })

	  // Mark disconnected on stream close
	  this.on('close', function () {
	    this.connected = false
	    clearTimeout(this.connackTimer)
	  })

	  // Setup ping timer
	  this.on('connect', this._setupPingTimer)

	  // Send queued packets
	  this.on('connect', function () {
	    var queue = this.queue

	    function deliver () {
	      var entry = queue.shift()
	      var packet = null

	      if (!entry) {
	        return
	      }

	      packet = entry.packet

	      that._sendPacket(
	        packet,
	        function (err) {
	          if (entry.cb) {
	            entry.cb(err)
	          }
	          deliver()
	        }
	      )
	    }

	    deliver()
	  })

	  var firstConnection = true
	  // resubscribe
	  this.on('connect', function () {
	    if (!firstConnection &&
	        this.options.clean &&
	        Object.keys(this._resubscribeTopics).length > 0) {
	      if (this.options.resubscribe) {
	        this._resubscribeTopics.resubscribe = true
	        this.subscribe(this._resubscribeTopics)
	      } else {
	        this._resubscribeTopics = {}
	      }
	    }

	    firstConnection = false
	  })

	  // Clear ping timer
	  this.on('close', function () {
	    if (that.pingTimer !== null) {
	      that.pingTimer.clear()
	      that.pingTimer = null
	    }
	  })

	  // Setup reconnect timer on disconnect
	  this.on('close', this._setupReconnect)

	  events.EventEmitter.call(this)

	  this._setupStream()
	}
	inherits(MqttClient, events.EventEmitter)

	/**
	 * setup the event handlers in the inner stream.
	 *
	 * @api private
	 */
	MqttClient.prototype._setupStream = function () {
	  var connectPacket
	  var that = this
	  var writable = new Writable()
	  var parser = mqttPacket.parser(this.options)
	  var completeParse = null
	  var packets = []

	  this._clearReconnect()

	  this.stream = this.streamBuilder(this)

	  parser.on('packet', function (packet) {
	    packets.push(packet)
	  })

	  function nextTickWork () {
	    process.nextTick(work)
	  }

	  function work () {
	    var packet = packets.shift()
	    var done = completeParse

	    if (packet) {
	      that._handlePacket(packet, nextTickWork)
	    } else {
	      completeParse = null
	      done()
	    }
	  }

	  writable._write = function (buf, enc, done) {
	    completeParse = done
	    parser.parse(buf)
	    work()
	  }

	  this.stream.pipe(writable)

	  // Suppress connection errors
	  this.stream.on('error', nop)

	  // Echo stream close
	  eos(this.stream, this.emit.bind(this, 'close'))

	  // Send a connect packet
	  connectPacket = Object.create(this.options)
	  connectPacket.cmd = 'connect'
	  // avoid message queue
	  sendPacket(this, connectPacket)

	  // Echo connection errors
	  parser.on('error', this.emit.bind(this, 'error'))

	  // many drain listeners are needed for qos 1 callbacks if the connection is intermittent
	  this.stream.setMaxListeners(1000)

	  clearTimeout(this.connackTimer)
	  this.connackTimer = setTimeout(function () {
	    that._cleanUp(true)
	  }, this.options.connectTimeout)
	}

	MqttClient.prototype._handlePacket = function (packet, done) {
	  this.emit('packetreceive', packet)

	  switch (packet.cmd) {
	    case 'publish':
	      this._handlePublish(packet, done)
	      break
	    case 'puback':
	    case 'pubrec':
	    case 'pubcomp':
	    case 'suback':
	    case 'unsuback':
	      this._handleAck(packet)
	      done()
	      break
	    case 'pubrel':
	      this._handlePubrel(packet, done)
	      break
	    case 'connack':
	      this._handleConnack(packet)
	      done()
	      break
	    case 'pingresp':
	      this._handlePingresp(packet)
	      done()
	      break
	    default:
	      // do nothing
	      // maybe we should do an error handling
	      // or just log it
	      break
	  }
	}

	MqttClient.prototype._checkDisconnecting = function (callback) {
	  if (this.disconnecting) {
	    if (callback) {
	      callback(new Error('client disconnecting'))
	    } else {
	      this.emit('error', new Error('client disconnecting'))
	    }
	  }
	  return this.disconnecting
	}

	/**
	 * publish - publish <message> to <topic>
	 *
	 * @param {String} topic - topic to publish to
	 * @param {String, Buffer} message - message to publish
	 * @param {Object} [opts] - publish options, includes:
	 *    {Number} qos - qos level to publish on
	 *    {Boolean} retain - whether or not to retain the message
	 *    {Boolean} dup - whether or not mark a message as duplicate
	 * @param {Function} [callback] - function(err){}
	 *    called when publish succeeds or fails
	 * @returns {MqttClient} this - for chaining
	 * @api public
	 *
	 * @example client.publish('topic', 'message');
	 * @example
	 *     client.publish('topic', 'message', {qos: 1, retain: true, dup: true});
	 * @example client.publish('topic', 'message', console.log);
	 */
	MqttClient.prototype.publish = function (topic, message, opts, callback) {
	  var packet

	  // .publish(topic, payload, cb);
	  if (typeof opts === 'function') {
	    callback = opts
	    opts = null
	  }

	  // default opts
	  var defaultOpts = {qos: 0, retain: false, dup: false}
	  opts = xtend(defaultOpts, opts)

	  if (this._checkDisconnecting(callback)) {
	    return this
	  }

	  packet = {
	    cmd: 'publish',
	    topic: topic,
	    payload: message,
	    qos: opts.qos,
	    retain: opts.retain,
	    messageId: this._nextId(),
	    dup: opts.dup
	  }

	  switch (opts.qos) {
	    case 1:
	    case 2:

	      // Add to callbacks
	      this.outgoing[packet.messageId] = callback || nop
	      this._sendPacket(packet)
	      break
	    default:
	      this._sendPacket(packet, callback)
	      break
	  }

	  return this
	}

	/**
	 * subscribe - subscribe to <topic>
	 *
	 * @param {String, Array, Object} topic - topic(s) to subscribe to, supports objects in the form {'topic': qos}
	 * @param {Object} [opts] - optional subscription options, includes:
	 *    {Number} qos - subscribe qos level
	 * @param {Function} [callback] - function(err, granted){} where:
	 *    {Error} err - subscription error (none at the moment!)
	 *    {Array} granted - array of {topic: 't', qos: 0}
	 * @returns {MqttClient} this - for chaining
	 * @api public
	 * @example client.subscribe('topic');
	 * @example client.subscribe('topic', {qos: 1});
	 * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log);
	 * @example client.subscribe('topic', console.log);
	 */
	MqttClient.prototype.subscribe = function () {
	  var packet
	  var args = Array.prototype.slice.call(arguments)
	  var subs = []
	  var obj = args.shift()
	  var resubscribe = obj.resubscribe
	  var callback = args.pop() || nop
	  var opts = args.pop()
	  var invalidTopic
	  var that = this

	  delete obj.resubscribe

	  if (typeof obj === 'string') {
	    obj = [obj]
	  }

	  if (typeof callback !== 'function') {
	    opts = callback
	    callback = nop
	  }

	  invalidTopic = validations.validateTopics(obj)
	  if (invalidTopic !== null) {
	    setImmediate(callback, new Error('Invalid topic ' + invalidTopic))
	    return this
	  }

	  if (this._checkDisconnecting(callback)) {
	    return this
	  }

	  var defaultOpts = { qos: 0 }
	  opts = xtend(defaultOpts, opts)

	  if (Array.isArray(obj)) {
	    obj.forEach(function (topic) {
	      if (that._resubscribeTopics[topic] < opts.qos ||
	          !that._resubscribeTopics.hasOwnProperty(topic) ||
	          resubscribe) {
	        subs.push({
	          topic: topic,
	          qos: opts.qos
	        })
	      }
	    })
	  } else {
	    Object
	      .keys(obj)
	      .forEach(function (k) {
	        if (that._resubscribeTopics[k] < obj[k] ||
	            !that._resubscribeTopics.hasOwnProperty(k) ||
	            resubscribe) {
	          subs.push({
	            topic: k,
	            qos: obj[k]
	          })
	        }
	      })
	  }

	  packet = {
	    cmd: 'subscribe',
	    subscriptions: subs,
	    qos: 1,
	    retain: false,
	    dup: false,
	    messageId: this._nextId()
	  }

	  if (!subs.length) {
	    callback(null, [])
	    return
	  }

	  // subscriptions to resubscribe to in case of disconnect
	  if (this.options.resubscribe) {
	    var topics = []
	    subs.forEach(function (sub) {
	      if (that.options.reconnectPeriod > 0) {
	        that._resubscribeTopics[sub.topic] = sub.qos
	        topics.push(sub.topic)
	      }
	    })
	    that.messageIdToTopic[packet.messageId] = topics
	  }

	  this.outgoing[packet.messageId] = function (err, packet) {
	    if (!err) {
	      var granted = packet.granted
	      for (var i = 0; i < granted.length; i += 1) {
	        subs[i].qos = granted[i]
	      }
	    }

	    callback(err, subs)
	  }

	  this._sendPacket(packet)

	  return this
	}

	/**
	 * unsubscribe - unsubscribe from topic(s)
	 *
	 * @param {String, Array} topic - topics to unsubscribe from
	 * @param {Function} [callback] - callback fired on unsuback
	 * @returns {MqttClient} this - for chaining
	 * @api public
	 * @example client.unsubscribe('topic');
	 * @example client.unsubscribe('topic', console.log);
	 */
	MqttClient.prototype.unsubscribe = function (topic, callback) {
	  var packet = {
	    cmd: 'unsubscribe',
	    qos: 1,
	    messageId: this._nextId()
	  }
	  var that = this

	  callback = callback || nop

	  if (this._checkDisconnecting(callback)) {
	    return this
	  }

	  if (typeof topic === 'string') {
	    packet.unsubscriptions = [topic]
	  } else if (typeof topic === 'object' && topic.length) {
	    packet.unsubscriptions = topic
	  }

	  if (this.options.resubscribe) {
	    packet.unsubscriptions.forEach(function (topic) {
	      delete that._resubscribeTopics[topic]
	    })
	  }

	  this.outgoing[packet.messageId] = callback

	  this._sendPacket(packet)

	  return this
	}

	/**
	 * end - close connection
	 *
	 * @returns {MqttClient} this - for chaining
	 * @param {Boolean} force - do not wait for all in-flight messages to be acked
	 * @param {Function} cb - called when the client has been closed
	 *
	 * @api public
	 */
	MqttClient.prototype.end = function (force, cb) {
	  var that = this

	  if (typeof force === 'function') {
	    cb = force
	    force = false
	  }

	  function closeStores () {
	    that.disconnected = true
	    that.incomingStore.close(function () {
	      that.outgoingStore.close(function () {
	        if (cb) {
	          cb.apply(null, arguments)
	        }
	        that.emit('end')
	      })
	    })
	    if (that._deferredReconnect) {
	      that._deferredReconnect()
	    }
	  }

	  function finish () {
	    // defer closesStores of an I/O cycle,
	    // just to make sure things are
	    // ok for websockets
	    that._cleanUp(force, setImmediate.bind(null, closeStores))
	  }

	  if (this.disconnecting) {
	    return this
	  }

	  this._clearReconnect()

	  this.disconnecting = true

	  if (!force && Object.keys(this.outgoing).length > 0) {
	    // wait 10ms, just to be sure we received all of it
	    this.once('outgoingEmpty', setTimeout.bind(null, finish, 10))
	  } else {
	    finish()
	  }

	  return this
	}

	/**
	 * removeOutgoingMessage - remove a message in outgoing store
	 * the outgoing callback will be called withe Error('Message removed') if the message is removed
	 *
	 * @param {Number} mid - messageId to remove message
	 * @returns {MqttClient} this - for chaining
	 * @api public
	 *
	 * @example client.removeOutgoingMessage(client.getLastMessageId());
	 */
	MqttClient.prototype.removeOutgoingMessage = function (mid) {
	  var cb = this.outgoing[mid]
	  delete this.outgoing[mid]
	  this.outgoingStore.del({messageId: mid}, function () {
	    cb(new Error('Message removed'))
	  })
	  return this
	}

	/**
	 * reconnect - connect again using the same options as connect()
	 *
	 * @param {Object} [opts] - optional reconnect options, includes:
	 *    {Store} incomingStore - a store for the incoming packets
	 *    {Store} outgoingStore - a store for the outgoing packets
	 *    if opts is not given, current stores are used
	 * @returns {MqttClient} this - for chaining
	 *
	 * @api public
	 */
	MqttClient.prototype.reconnect = function (opts) {
	  var that = this
	  var f = function () {
	    if (opts) {
	      that.options.incomingStore = opts.incomingStore
	      that.options.outgoingStore = opts.outgoingStore
	    } else {
	      that.options.incomingStore = null
	      that.options.outgoingStore = null
	    }
	    that.incomingStore = that.options.incomingStore || new Store()
	    that.outgoingStore = that.options.outgoingStore || new Store()
	    that.disconnecting = false
	    that.disconnected = false
	    that._deferredReconnect = null
	    that._reconnect()
	  }

	  if (this.disconnecting && !this.disconnected) {
	    this._deferredReconnect = f
	  } else {
	    f()
	  }
	  return this
	}

	/**
	 * _reconnect - implement reconnection
	 * @api privateish
	 */
	MqttClient.prototype._reconnect = function () {
	  this.emit('reconnect')
	  this._setupStream()
	}

	/**
	 * _setupReconnect - setup reconnect timer
	 */
	MqttClient.prototype._setupReconnect = function () {
	  var that = this

	  if (!that.disconnecting && !that.reconnectTimer && (that.options.reconnectPeriod > 0)) {
	    if (!this.reconnecting) {
	      this.emit('offline')
	      this.reconnecting = true
	    }
	    that.reconnectTimer = setInterval(function () {
	      that._reconnect()
	    }, that.options.reconnectPeriod)
	  }
	}

	/**
	 * _clearReconnect - clear the reconnect timer
	 */
	MqttClient.prototype._clearReconnect = function () {
	  if (this.reconnectTimer) {
	    clearInterval(this.reconnectTimer)
	    this.reconnectTimer = null
	  }
	}

	/**
	 * _cleanUp - clean up on connection end
	 * @api private
	 */
	MqttClient.prototype._cleanUp = function (forced, done) {
	  if (done) {
	    this.stream.on('close', done)
	  }

	  if (forced) {
	    if ((this.options.reconnectPeriod === 0) && this.options.clean) {
	      flush(this.outgoing)
	    }
	    this.stream.destroy()
	  } else {
	    this._sendPacket(
	      { cmd: 'disconnect' },
	      setImmediate.bind(
	        null,
	        this.stream.end.bind(this.stream)
	      )
	    )
	  }

	  if (!this.disconnecting) {
	    this._clearReconnect()
	    this._setupReconnect()
	  }

	  if (this.pingTimer !== null) {
	    this.pingTimer.clear()
	    this.pingTimer = null
	  }

	  if (done && !this.connected) {
	    this.stream.removeListener('close', done)
	    done()
	  }
	}

	/**
	 * _sendPacket - send or queue a packet
	 * @param {String} type - packet type (see `protocol`)
	 * @param {Object} packet - packet options
	 * @param {Function} cb - callback when the packet is sent
	 * @api private
	 */
	MqttClient.prototype._sendPacket = function (packet, cb) {
	  if (!this.connected) {
	    if (((packet.qos || 0) === 0 && this.queueQoSZero) || packet.cmd !== 'publish') {
	      this.queue.push({ packet: packet, cb: cb })
	    } else if (packet.qos > 0) {
	      cb = this.outgoing[packet.messageId]
	      this.outgoingStore.put(packet, function (err) {
	        if (err) {
	          return cb && cb(err)
	        }
	      })
	    } else if (cb) {
	      cb(new Error('No connection to broker'))
	    }

	    return
	  }

	  // When sending a packet, reschedule the ping timer
	  this._shiftPingInterval()

	  switch (packet.cmd) {
	    case 'publish':
	      break
	    case 'pubrel':
	      storeAndSend(this, packet, cb)
	      return
	    default:
	      sendPacket(this, packet, cb)
	      return
	  }

	  switch (packet.qos) {
	    case 2:
	    case 1:
	      storeAndSend(this, packet, cb)
	      break
	    /**
	     * no need of case here since it will be caught by default
	     * and jshint comply that before default it must be a break
	     * anyway it will result in -1 evaluation
	     */
	    case 0:
	      /* falls through */
	    default:
	      sendPacket(this, packet, cb)
	      break
	  }
	}

	/**
	 * _setupPingTimer - setup the ping timer
	 *
	 * @api private
	 */
	MqttClient.prototype._setupPingTimer = function () {
	  var that = this

	  if (!this.pingTimer && this.options.keepalive) {
	    this.pingResp = true
	    this.pingTimer = reInterval(function () {
	      that._checkPing()
	    }, this.options.keepalive * 1000)
	  }
	}

	/**
	 * _shiftPingInterval - reschedule the ping interval
	 *
	 * @api private
	 */
	MqttClient.prototype._shiftPingInterval = function () {
	  if (this.pingTimer && this.options.keepalive && this.options.reschedulePings) {
	    this.pingTimer.reschedule(this.options.keepalive * 1000)
	  }
	}
	/**
	 * _checkPing - check if a pingresp has come back, and ping the server again
	 *
	 * @api private
	 */
	MqttClient.prototype._checkPing = function () {
	  if (this.pingResp) {
	    this.pingResp = false
	    this._sendPacket({ cmd: 'pingreq' })
	  } else {
	    // do a forced cleanup since socket will be in bad shape
	    this._cleanUp(true)
	  }
	}

	/**
	 * _handlePingresp - handle a pingresp
	 *
	 * @api private
	 */
	MqttClient.prototype._handlePingresp = function () {
	  this.pingResp = true
	}

	/**
	 * _handleConnack
	 *
	 * @param {Object} packet
	 * @api private
	 */

	MqttClient.prototype._handleConnack = function (packet) {
	  var rc = packet.returnCode
	  var errors = [
	    '',
	    'Unacceptable protocol version',
	    'Identifier rejected',
	    'Server unavailable',
	    'Bad username or password',
	    'Not authorized'
	  ]

	  clearTimeout(this.connackTimer)

	  if (rc === 0) {
	    this.reconnecting = false
	    this.emit('connect', packet)
	  } else if (rc > 0) {
	    var err = new Error('Connection refused: ' + errors[rc])
	    err.code = rc
	    this.emit('error', err)
	  }
	}

	/**
	 * _handlePublish
	 *
	 * @param {Object} packet
	 * @api private
	 */
	/*
	those late 2 case should be rewrite to comply with coding style:

	case 1:
	case 0:
	  // do not wait sending a puback
	  // no callback passed
	  if (1 === qos) {
	    this._sendPacket({
	      cmd: 'puback',
	      messageId: mid
	    });
	  }
	  // emit the message event for both qos 1 and 0
	  this.emit('message', topic, message, packet);
	  this.handleMessage(packet, done);
	  break;
	default:
	  // do nothing but every switch mus have a default
	  // log or throw an error about unknown qos
	  break;

	for now i just suppressed the warnings
	*/
	MqttClient.prototype._handlePublish = function (packet, done) {
	  done = typeof done !== 'undefined' ? done : nop
	  var topic = packet.topic.toString()
	  var message = packet.payload
	  var qos = packet.qos
	  var mid = packet.messageId
	  var that = this

	  switch (qos) {
	    case 2:
	      this.incomingStore.put(packet, function (err) {
	        if (err) {
	          return done(err)
	        }
	        that._sendPacket({cmd: 'pubrec', messageId: mid}, done)
	      })
	      break
	    case 1:
	      // emit the message event
	      this.emit('message', topic, message, packet)
	      this.handleMessage(packet, function (err) {
	        if (err) {
	          return done(err)
	        }
	        // send 'puback' if the above 'handleMessage' method executed
	        // successfully.
	        that._sendPacket({cmd: 'puback', messageId: mid}, done)
	      })
	      break
	    case 0:
	      // emit the message event
	      this.emit('message', topic, message, packet)
	      this.handleMessage(packet, done)
	      break
	    default:
	      // do nothing
	      // log or throw an error about unknown qos
	      break
	  }
	}

	/**
	 * Handle messages with backpressure support, one at a time.
	 * Override at will.
	 *
	 * @param Packet packet the packet
	 * @param Function callback call when finished
	 * @api public
	 */
	MqttClient.prototype.handleMessage = function (packet, callback) {
	  callback()
	}

	/**
	 * _handleAck
	 *
	 * @param {Object} packet
	 * @api private
	 */

	MqttClient.prototype._handleAck = function (packet) {
	  /* eslint no-fallthrough: "off" */
	  var mid = packet.messageId
	  var type = packet.cmd
	  var response = null
	  var cb = this.outgoing[mid]
	  var that = this

	  if (!cb) {
	    // Server sent an ack in error, ignore it.
	    return
	  }

	  // Process
	  switch (type) {
	    case 'pubcomp':
	      // same thing as puback for QoS 2
	    case 'puback':
	      // Callback - we're done
	      delete this.outgoing[mid]
	      this.outgoingStore.del(packet, cb)
	      break
	    case 'pubrec':
	      response = {
	        cmd: 'pubrel',
	        qos: 2,
	        messageId: mid
	      }

	      this._sendPacket(response)
	      break
	    case 'suback':
	      delete this.outgoing[mid]
	      if (packet.granted.length === 1 && (packet.granted[0] & 0x80) !== 0) {
	        // suback with Failure status
	        var topics = this.messageIdToTopic[mid]
	        if (topics) {
	          topics.forEach(function (topic) {
	            delete that._resubscribeTopics[topic]
	          })
	        }
	      }
	      cb(null, packet)
	      break
	    case 'unsuback':
	      delete this.outgoing[mid]
	      cb(null)
	      break
	    default:
	      that.emit('error', new Error('unrecognized packet type'))
	  }

	  if (this.disconnecting &&
	      Object.keys(this.outgoing).length === 0) {
	    this.emit('outgoingEmpty')
	  }
	}

	/**
	 * _handlePubrel
	 *
	 * @param {Object} packet
	 * @api private
	 */
	MqttClient.prototype._handlePubrel = function (packet, callback) {
	  callback = typeof callback !== 'undefined' ? callback : nop
	  var mid = packet.messageId
	  var that = this

	  var comp = {cmd: 'pubcomp', messageId: mid}

	  that.incomingStore.get(packet, function (err, pub) {
	    if (!err && pub.cmd !== 'pubrel') {
	      that.emit('message', pub.topic, pub.payload, pub)
	      that.incomingStore.put(packet, function (err) {
	        if (err) {
	          return callback(err)
	        }
	        that.handleMessage(pub, function (err) {
	          if (err) {
	            return callback(err)
	          }
	          that._sendPacket(comp, callback)
	        })
	      })
	    } else {
	      that._sendPacket(comp, callback)
	    }
	  })
	}

	/**
	 * _nextId
	 * @return unsigned int
	 */
	MqttClient.prototype._nextId = function () {
	  // id becomes current state of this.nextId and increments afterwards
	  var id = this.nextId++
	  // Ensure 16 bit unsigned int (max 65535, nextId got one higher)
	  if (this.nextId === 65536) {
	    this.nextId = 1
	  }
	  return id
	}

	/**
	 * getLastMessageId
	 * @return unsigned int
	 */
	MqttClient.prototype.getLastMessageId = function () {
	  return (this.nextId === 1) ? 65535 : (this.nextId - 1)
	}

	module.exports = MqttClient

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict'

	/**
	 * Module dependencies
	 */
	var xtend = __webpack_require__(51)

	var Readable = __webpack_require__(52).Readable
	var streamsOpts = { objectMode: true }
	var defaultStoreOptions = {
	  clean: true
	}

	/**
	 * es6-map can preserve insertion order even if ES version is older.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Description
	 * It should be noted that a Map which is a map of an object, especially
	 * a dictionary of dictionaries, will only map to the object's insertion
	 * order. In ES2015 this is ordered for objects but for older versions of
	 * ES, this may be random and not ordered.
	 *
	 */
	var Map = __webpack_require__(75)

	/**
	 * In-memory implementation of the message store
	 * This can actually be saved into files.
	 *
	 * @param {Object} [options] - store options
	 */
	function Store (options) {
	  if (!(this instanceof Store)) {
	    return new Store(options)
	  }

	  this.options = options || {}

	  // Defaults
	  this.options = xtend(defaultStoreOptions, options)

	  this._inflights = new Map()
	}

	/**
	 * Adds a packet to the store, a packet is
	 * anything that has a messageId property.
	 *
	 */
	Store.prototype.put = function (packet, cb) {
	  this._inflights.set(packet.messageId, packet)

	  if (cb) {
	    cb()
	  }

	  return this
	}

	/**
	 * Creates a stream with all the packets in the store
	 *
	 */
	Store.prototype.createStream = function () {
	  var stream = new Readable(streamsOpts)
	  var destroyed = false
	  var values = []
	  var i = 0

	  this._inflights.forEach(function (value, key) {
	    values.push(value)
	  })

	  stream._read = function () {
	    if (!destroyed && i < values.length) {
	      this.push(values[i++])
	    } else {
	      this.push(null)
	    }
	  }

	  stream.destroy = function () {
	    if (destroyed) {
	      return
	    }

	    var self = this

	    destroyed = true

	    process.nextTick(function () {
	      self.emit('close')
	    })
	  }

	  return stream
	}

	/**
	 * deletes a packet from the store.
	 */
	Store.prototype.del = function (packet, cb) {
	  packet = this._inflights.get(packet.messageId)
	  if (packet) {
	    this._inflights.delete(packet.messageId)
	    cb(null, packet)
	  } else if (cb) {
	    cb(new Error('missing packet'))
	  }

	  return this
	}

	/**
	 * get a packet from the store.
	 */
	Store.prototype.get = function (packet, cb) {
	  packet = this._inflights.get(packet.messageId)
	  if (packet) {
	    cb(null, packet)
	  } else if (cb) {
	    cb(new Error('missing packet'))
	  }

	  return this
	}

	/**
	 * Close the store
	 */
	Store.prototype.close = function (cb) {
	  if (this.options.clean) {
	    this._inflights = null
	  }
	  if (cb) {
	    cb()
	  }
	}

	module.exports = Store

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 51 */
/***/ (function(module, exports) {

	module.exports = extend

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function extend() {
	    var target = {}

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i]

	        for (var key in source) {
	            if (hasOwnProperty.call(source, key)) {
	                target[key] = source[key]
	            }
	        }
	    }

	    return target
	}


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(53);
	exports.Stream = exports;
	exports.Readable = exports;
	exports.Writable = __webpack_require__(67);
	exports.Duplex = __webpack_require__(66);
	exports.Transform = __webpack_require__(73);
	exports.PassThrough = __webpack_require__(74);


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(54);
	/*</replacement>*/

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(55);
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	/*<replacement>*/
	var EE = __webpack_require__(3).EventEmitter;

	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(56);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var debugUtil = __webpack_require__(62);
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/

	var BufferList = __webpack_require__(63);
	var destroyImpl = __webpack_require__(65);
	var StringDecoder;

	util.inherits(Readable, Stream);

	var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

	  // This is a hack to make sure that our error handler is attached before any
	  // userland ones.  NEVER DO THIS. This is here only because this code needs
	  // to continue to work with older versions of Node.js that do not include
	  // the prependListener() method. The goal is to eventually remove this hack.
	  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
	}

	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(66);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var readableHwm = options.readableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the event 'readable'/'data' is emitted
	  // immediately, or on a later tick.  We set this to true at first, because
	  // any actions that shouldn't happen until "later" should generally also
	  // not happen before the first read call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(72).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(66);

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options) {
	    if (typeof options.read === 'function') this._read = options.read;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
	  }

	  Stream.call(this);
	}

	Object.defineProperty(Readable.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._readableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	  }
	});

	Readable.prototype.destroy = destroyImpl.destroy;
	Readable.prototype._undestroy = destroyImpl.undestroy;
	Readable.prototype._destroy = function (err, cb) {
	  this.push(null);
	  cb(err);
	};

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;
	  var skipChunkCheck;

	  if (!state.objectMode) {
	    if (typeof chunk === 'string') {
	      encoding = encoding || state.defaultEncoding;
	      if (encoding !== state.encoding) {
	        chunk = Buffer.from(chunk, encoding);
	        encoding = '';
	      }
	      skipChunkCheck = true;
	    }
	  } else {
	    skipChunkCheck = true;
	  }

	  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  return readableAddChunk(this, chunk, null, true, false);
	};

	function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
	  var state = stream._readableState;
	  if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else {
	    var er;
	    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
	    if (er) {
	      stream.emit('error', er);
	    } else if (state.objectMode || chunk && chunk.length > 0) {
	      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
	        chunk = _uint8ArrayToBuffer(chunk);
	      }

	      if (addToFront) {
	        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
	      } else if (state.ended) {
	        stream.emit('error', new Error('stream.push() after EOF'));
	      } else {
	        state.reading = false;
	        if (state.decoder && !encoding) {
	          chunk = state.decoder.write(chunk);
	          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
	        } else {
	          addChunk(stream, state, chunk, false);
	        }
	      }
	    } else if (!addToFront) {
	      state.reading = false;
	    }
	  }

	  return needMoreData(state);
	}

	function addChunk(stream, state, chunk, addToFront) {
	  if (state.flowing && state.length === 0 && !state.sync) {
	    stream.emit('data', chunk);
	    stream.read(0);
	  } else {
	    // update the buffer info.
	    state.length += state.objectMode ? 1 : chunk.length;
	    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	    if (state.needReadable) emitReadable(stream);
	  }
	  maybeReadMore(stream, state);
	}

	function chunkInvalid(state, chunk) {
	  var er;
	  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(72).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;

	  if (n !== 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }

	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    pna.nextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('_read() is not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

	  var endFn = doEnd ? onend : unpipe;
	  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable, unpipeInfo) {
	    debug('onunpipe');
	    if (readable === src) {
	      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
	        unpipeInfo.hasUnpiped = true;
	        cleanup();
	      }
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', unpipe);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }

	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;
	  var unpipeInfo = { hasUnpiped: false };

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this, unpipeInfo);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++) {
	      dests[i].emit('unpipe', this, unpipeInfo);
	    }return this;
	  }

	  // try to find the right one.
	  var index = indexOf(state.pipes, dest);
	  if (index === -1) return this;

	  state.pipes.splice(index, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this, unpipeInfo);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        pna.nextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    pna.nextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var _this = this;

	  var state = this._readableState;
	  var paused = false;

	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) _this.push(chunk);
	    }

	    _this.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = _this.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  for (var n = 0; n < kProxyEvents.length; n++) {
	    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
	  }

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  this._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return this;
	};

	Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._readableState.highWaterMark;
	  }
	});

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;

	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }

	  return ret;
	}

	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}

	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = Buffer.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    pna.nextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = { nextTick: nextTick };
	} else {
	  module.exports = process
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 55 */
/***/ (function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(3).EventEmitter;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

	/* eslint-disable node/no-deprecated-api */
	var buffer = __webpack_require__(58)
	var Buffer = buffer.Buffer

	// alternative to using Object.keys for old browsers
	function copyProps (src, dst) {
	  for (var key in src) {
	    dst[key] = src[key]
	  }
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
	  module.exports = buffer
	} else {
	  // Copy properties from require('buffer')
	  copyProps(buffer, exports)
	  exports.Buffer = SafeBuffer
	}

	function SafeBuffer (arg, encodingOrOffset, length) {
	  return Buffer(arg, encodingOrOffset, length)
	}

	// Copy static methods from Buffer
	copyProps(Buffer, SafeBuffer)

	SafeBuffer.from = function (arg, encodingOrOffset, length) {
	  if (typeof arg === 'number') {
	    throw new TypeError('Argument must not be a number')
	  }
	  return Buffer(arg, encodingOrOffset, length)
	}

	SafeBuffer.alloc = function (size, fill, encoding) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  var buf = Buffer(size)
	  if (fill !== undefined) {
	    if (typeof encoding === 'string') {
	      buf.fill(fill, encoding)
	    } else {
	      buf.fill(fill)
	    }
	  } else {
	    buf.fill(0)
	  }
	  return buf
	}

	SafeBuffer.allocUnsafe = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return Buffer(size)
	}

	SafeBuffer.allocUnsafeSlow = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return buffer.SlowBuffer(size)
	}


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(59)
	var ieee754 = __webpack_require__(60)
	var isArray = __webpack_require__(55)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	/*
	 * Export kMaxLength after typed array support is determined.
	 */
	exports.kMaxLength = kMaxLength()

	function typedArraySupport () {
	  try {
	    var arr = new Uint8Array(1)
	    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
	    return arr.foo() === 42 && // typed array instances can be augmented
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length)
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length)
	    }
	    that.length = length
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192 // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype
	  return arr
	}

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	  if (typeof Symbol !== 'undefined' && Symbol.species &&
	      Buffer[Symbol.species] === Buffer) {
	    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
	    Object.defineProperty(Buffer, Symbol.species, {
	      value: null,
	      configurable: true
	    })
	  }
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size)
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	}

	function allocUnsafe (that, size) {
	  assertSize(size)
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	}
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8'
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0
	  that = createBuffer(that, length)

	  var actual = that.write(string, encoding)

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual)
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0
	  that = createBuffer(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array)
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset)
	  } else {
	    array = new Uint8Array(array, byteOffset, length)
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array)
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (Buffer.isBuffer(obj)) {
	    var len = checked(obj.length) | 0
	    that = createBuffer(that, len)

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len)
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (length) {
	  if (+length != length) { // eslint-disable-line eqeqeq
	    length = 0
	  }
	  return Buffer.alloc(+length)
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i]
	      y = b[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	}

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length)
	  var pos = 0
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i]
	    if (!Buffer.isBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos)
	    pos += buf.length
	  }
	  return buffer
	}

	function byteLength (string, encoding) {
	  if (Buffer.isBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string
	  }

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0
	  start >>>= 0

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8'

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true

	function swap (b, n, m) {
	  var i = b[n]
	  b[n] = b[m]
	  b[m] = i
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1)
	  }
	  return this
	}

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3)
	    swap(this, i + 1, i + 2)
	  }
	  return this
	}

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7)
	    swap(this, i + 1, i + 6)
	    swap(this, i + 2, i + 5)
	    swap(this, i + 3, i + 4)
	  }
	  return this
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!Buffer.isBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0
	  }
	  if (thisStart === undefined) {
	    thisStart = 0
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0
	  end >>>= 0
	  thisStart >>>= 0
	  thisEnd >>>= 0

	  if (this === target) return 0

	  var x = thisEnd - thisStart
	  var y = end - start
	  var len = Math.min(x, y)

	  var thisCopy = this.slice(thisStart, thisEnd)
	  var targetCopy = target.slice(start, end)

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i]
	      y = targetCopy[i]
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset
	    byteOffset = 0
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000
	  }
	  byteOffset = +byteOffset  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1)
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding)
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (Buffer.isBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1
	  var arrLength = arr.length
	  var valLength = val.length

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase()
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2
	      arrLength /= 2
	      valLength /= 2
	      byteOffset /= 2
	    }
	  }

	  function read (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i
	  if (dir) {
	    var foundIndex = -1
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex
	        foundIndex = -1
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true
	      for (var j = 0; j < valLength; j++) {
	        if (read(arr, i + j) !== read(val, j)) {
	          found = false
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	}

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	}

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0
	  var remaining = buf.length - offset
	  if (!length) {
	    length = remaining
	  } else {
	    length = Number(length)
	    if (length > remaining) {
	      length = remaining
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	}

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return base64.fromByteArray(buf)
	  } else {
	    return base64.fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length

	  if (!start || start < 0) start = 0
	  if (!end || end < 0 || end > len) end = len

	  var out = ''
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i])
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end)
	  var res = ''
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end)
	    newBuf.__proto__ = Buffer.prototype
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1
	    checkInt(this, value, offset, byteLength, maxBytes, 0)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    )
	  }

	  return len
	}

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start
	      start = 0
	      end = this.length
	    } else if (typeof end === 'string') {
	      encoding = end
	      end = this.length
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0)
	      if (code < 256) {
	        val = code
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0
	  end = end === undefined ? this.length : end >>> 0

	  if (!val) val = 0

	  var i
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val
	    }
	  } else {
	    var bytes = Buffer.isBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString())
	    var len = bytes.length
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len]
	    }
	  }

	  return this
	}

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '='
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 59 */
/***/ (function(module, exports) {

	'use strict'

	exports.byteLength = byteLength
	exports.toByteArray = toByteArray
	exports.fromByteArray = fromByteArray

	var lookup = []
	var revLookup = []
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i]
	  revLookup[code.charCodeAt(i)] = i
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63

	function getLens (b64) {
	  var len = b64.length

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=')
	  if (validLen === -1) validLen = len

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4)

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64)
	  var validLen = lens[0]
	  var placeHoldersLen = lens[1]
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp
	  var lens = getLens(b64)
	  var validLen = lens[0]
	  var placeHoldersLen = lens[1]

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

	  var curByte = 0

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen

	  for (var i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)]
	    arr[curByte++] = (tmp >> 16) & 0xFF
	    arr[curByte++] = (tmp >> 8) & 0xFF
	    arr[curByte++] = tmp & 0xFF
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4)
	    arr[curByte++] = tmp & 0xFF
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2)
	    arr[curByte++] = (tmp >> 8) & 0xFF
	    arr[curByte++] = tmp & 0xFF
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp
	  var output = []
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF)
	    output.push(tripletToBase64(tmp))
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp
	  var len = uint8.length
	  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
	  var parts = []
	  var maxChunkLength = 16383 // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(
	      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
	    ))
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1]
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    )
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    )
	  }

	  return parts.join('')
	}


/***/ }),
/* 60 */
/***/ (function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.

	function isArray(arg) {
	  if (Array.isArray) {
	    return Array.isArray(arg);
	  }
	  return objectToString(arg) === '[object Array]';
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = Buffer.isBuffer;

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(58).Buffer))

/***/ }),
/* 62 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Buffer = __webpack_require__(57).Buffer;
	var util = __webpack_require__(64);

	function copyBuffer(src, target, offset) {
	  src.copy(target, offset);
	}

	module.exports = function () {
	  function BufferList() {
	    _classCallCheck(this, BufferList);

	    this.head = null;
	    this.tail = null;
	    this.length = 0;
	  }

	  BufferList.prototype.push = function push(v) {
	    var entry = { data: v, next: null };
	    if (this.length > 0) this.tail.next = entry;else this.head = entry;
	    this.tail = entry;
	    ++this.length;
	  };

	  BufferList.prototype.unshift = function unshift(v) {
	    var entry = { data: v, next: this.head };
	    if (this.length === 0) this.tail = entry;
	    this.head = entry;
	    ++this.length;
	  };

	  BufferList.prototype.shift = function shift() {
	    if (this.length === 0) return;
	    var ret = this.head.data;
	    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	    --this.length;
	    return ret;
	  };

	  BufferList.prototype.clear = function clear() {
	    this.head = this.tail = null;
	    this.length = 0;
	  };

	  BufferList.prototype.join = function join(s) {
	    if (this.length === 0) return '';
	    var p = this.head;
	    var ret = '' + p.data;
	    while (p = p.next) {
	      ret += s + p.data;
	    }return ret;
	  };

	  BufferList.prototype.concat = function concat(n) {
	    if (this.length === 0) return Buffer.alloc(0);
	    if (this.length === 1) return this.head.data;
	    var ret = Buffer.allocUnsafe(n >>> 0);
	    var p = this.head;
	    var i = 0;
	    while (p) {
	      copyBuffer(p.data, ret, i);
	      i += p.data.length;
	      p = p.next;
	    }
	    return ret;
	  };

	  return BufferList;
	}();

	if (util && util.inspect && util.inspect.custom) {
	  module.exports.prototype[util.inspect.custom] = function () {
	    var obj = util.inspect({ length: this.length });
	    return this.constructor.name + ' ' + obj;
	  };
	}

/***/ }),
/* 64 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(54);
	/*</replacement>*/

	// undocumented cb() API, needed for core, not for public API
	function destroy(err, cb) {
	  var _this = this;

	  var readableDestroyed = this._readableState && this._readableState.destroyed;
	  var writableDestroyed = this._writableState && this._writableState.destroyed;

	  if (readableDestroyed || writableDestroyed) {
	    if (cb) {
	      cb(err);
	    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
	      pna.nextTick(emitErrorNT, this, err);
	    }
	    return this;
	  }

	  // we set destroyed to true before firing error callbacks in order
	  // to make it re-entrance safe in case destroy() is called within callbacks

	  if (this._readableState) {
	    this._readableState.destroyed = true;
	  }

	  // if this is a duplex stream mark the writable part as destroyed as well
	  if (this._writableState) {
	    this._writableState.destroyed = true;
	  }

	  this._destroy(err || null, function (err) {
	    if (!cb && err) {
	      pna.nextTick(emitErrorNT, _this, err);
	      if (_this._writableState) {
	        _this._writableState.errorEmitted = true;
	      }
	    } else if (cb) {
	      cb(err);
	    }
	  });

	  return this;
	}

	function undestroy() {
	  if (this._readableState) {
	    this._readableState.destroyed = false;
	    this._readableState.reading = false;
	    this._readableState.ended = false;
	    this._readableState.endEmitted = false;
	  }

	  if (this._writableState) {
	    this._writableState.destroyed = false;
	    this._writableState.ended = false;
	    this._writableState.ending = false;
	    this._writableState.finished = false;
	    this._writableState.errorEmitted = false;
	  }
	}

	function emitErrorNT(self, err) {
	  self.emit('error', err);
	}

	module.exports = {
	  destroy: destroy,
	  undestroy: undestroy
	};

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(54);
	/*</replacement>*/

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/

	module.exports = Duplex;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	var Readable = __webpack_require__(53);
	var Writable = __webpack_require__(67);

	util.inherits(Duplex, Readable);

	{
	  // avoid scope creep, the keys array can then be collected
	  var keys = objectKeys(Writable.prototype);
	  for (var v = 0; v < keys.length; v++) {
	    var method = keys[v];
	    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	  }
	}

	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  pna.nextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	Object.defineProperty(Duplex.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed && this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	    this._writableState.destroyed = value;
	  }
	});

	Duplex.prototype._destroy = function (err, cb) {
	  this.push(null);
	  this.end();

	  pna.nextTick(cb, err);
	};

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(54);
	/*</replacement>*/

	module.exports = Writable;

	/* <replacement> */
	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;
	  this.finish = function () {
	    onCorkedFinish(_this, state);
	  };
	}
	/* </replacement> */

	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Writable.WritableState = WritableState;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(71)
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(56);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	var destroyImpl = __webpack_require__(65);

	util.inherits(Writable, Stream);

	function nop() {}

	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(66);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var writableHwm = options.writableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // if _final has been called
	  this.finalCalled = false;

	  // drain event flag.
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function getBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};

	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
	    });
	  } catch (_) {}
	})();

	// Test _writableState for inheritance to account for Duplex streams,
	// whose prototype chain only points to Readable.
	var realHasInstance;
	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
	  realHasInstance = Function.prototype[Symbol.hasInstance];
	  Object.defineProperty(Writable, Symbol.hasInstance, {
	    value: function (object) {
	      if (realHasInstance.call(this, object)) return true;
	      if (this !== Writable) return false;

	      return object && object._writableState instanceof WritableState;
	    }
	  });
	} else {
	  realHasInstance = function (object) {
	    return object instanceof this;
	  };
	}

	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(66);

	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.

	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.
	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
	    return new Writable(options);
	  }

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;

	    if (typeof options.final === 'function') this._final = options.final;
	  }

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  pna.nextTick(cb, er);
	}

	// Checks that a user-supplied chunk is valid, especially for the particular
	// mode the stream is in. Currently this means that `null` is never accepted
	// and undefined/non-string values are only allowed in object mode.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;

	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    pna.nextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	  var isBuf = !state.objectMode && _isUint8Array(chunk);

	  if (isBuf && !Buffer.isBuffer(chunk)) {
	    chunk = _uint8ArrayToBuffer(chunk);
	  }

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = Buffer.from(chunk, encoding);
	  }
	  return chunk;
	}

	Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
	  if (!isBuf) {
	    var newChunk = decodeChunk(state, chunk, encoding);
	    if (chunk !== newChunk) {
	      isBuf = true;
	      encoding = 'buffer';
	      chunk = newChunk;
	    }
	  }
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = {
	      chunk: chunk,
	      encoding: encoding,
	      isBuf: isBuf,
	      callback: cb,
	      next: null
	    };
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;

	  if (sync) {
	    // defer the callback if we are being called synchronously
	    // to avoid piling up things on the stack
	    pna.nextTick(cb, er);
	    // this can emit finish, and it will always happen
	    // after error
	    pna.nextTick(finishMaybe, stream, state);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	  } else {
	    // the caller expect this to happen before if
	    // it is async
	    cb(er);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	    // this can emit finish, but finish must
	    // always follow error
	    finishMaybe(stream, state);
	  }
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    var allBuffers = true;
	    while (entry) {
	      buffer[count] = entry;
	      if (!entry.isBuf) allBuffers = false;
	      entry = entry.next;
	      count += 1;
	    }
	    buffer.allBuffers = allBuffers;

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	    state.bufferedRequestCount = 0;
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      state.bufferedRequestCount--;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('_write() is not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}
	function callFinal(stream, state) {
	  stream._final(function (err) {
	    state.pendingcb--;
	    if (err) {
	      stream.emit('error', err);
	    }
	    state.prefinished = true;
	    stream.emit('prefinish');
	    finishMaybe(stream, state);
	  });
	}
	function prefinish(stream, state) {
	  if (!state.prefinished && !state.finalCalled) {
	    if (typeof stream._final === 'function') {
	      state.pendingcb++;
	      state.finalCalled = true;
	      pna.nextTick(callFinal, stream, state);
	    } else {
	      state.prefinished = true;
	      stream.emit('prefinish');
	    }
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    prefinish(stream, state);
	    if (state.pendingcb === 0) {
	      state.finished = true;
	      stream.emit('finish');
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	function onCorkedFinish(corkReq, state, err) {
	  var entry = corkReq.entry;
	  corkReq.entry = null;
	  while (entry) {
	    var cb = entry.callback;
	    state.pendingcb--;
	    cb(err);
	    entry = entry.next;
	  }
	  if (state.corkedRequestsFree) {
	    state.corkedRequestsFree.next = corkReq;
	  } else {
	    state.corkedRequestsFree = corkReq;
	  }
	}

	Object.defineProperty(Writable.prototype, 'destroyed', {
	  get: function () {
	    if (this._writableState === undefined) {
	      return false;
	    }
	    return this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._writableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._writableState.destroyed = value;
	  }
	});

	Writable.prototype.destroy = destroyImpl.destroy;
	Writable.prototype._undestroy = destroyImpl.undestroy;
	Writable.prototype._destroy = function (err, cb) {
	  this.end();
	  cb(err);
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48), __webpack_require__(68).setImmediate, (function() { return this; }())))

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

	var apply = Function.prototype.apply;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) {
	  if (timeout) {
	    timeout.close();
	  }
	};

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// setimmediate attaches itself to the global object
	__webpack_require__(69);
	var global = __webpack_require__(70);
	exports.setImmediate = global.setImmediate;
	exports.clearImmediate = global.clearImmediate;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
	    "use strict";

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var registerImmediate;

	    function setImmediate(callback) {
	      // Callback can either be a function or a string
	      if (typeof callback !== "function") {
	        callback = new Function("" + callback);
	      }
	      // Copy function arguments
	      var args = new Array(arguments.length - 1);
	      for (var i = 0; i < args.length; i++) {
	          args[i] = arguments[i + 1];
	      }
	      // Store and register the task
	      var task = { callback: callback, args: args };
	      tasksByHandle[nextHandle] = task;
	      registerImmediate(nextHandle);
	      return nextHandle++;
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function run(task) {
	        var callback = task.callback;
	        var args = task.args;
	        switch (args.length) {
	        case 0:
	            callback();
	            break;
	        case 1:
	            callback(args[0]);
	            break;
	        case 2:
	            callback(args[0], args[1]);
	            break;
	        case 3:
	            callback(args[0], args[1], args[2]);
	            break;
	        default:
	            callback.apply(undefined, args);
	            break;
	        }
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(runIfPresent, 0, handle);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    run(task);
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function installNextTickImplementation() {
	        registerImmediate = function(handle) {
	            process.nextTick(function () { runIfPresent(handle); });
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        registerImmediate = function(handle) {
	            global.postMessage(messagePrefix + handle, "*");
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        registerImmediate = function(handle) {
	            channel.port2.postMessage(handle);
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        registerImmediate = function(handle) {
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	        };
	    }

	    function installSetTimeoutImplementation() {
	        registerImmediate = function(handle) {
	            setTimeout(runIfPresent, 0, handle);
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6???8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 70 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {var win;

	if (typeof window !== "undefined") {
	    win = window;
	} else if (typeof global !== "undefined") {
	    win = global;
	} else if (typeof self !== "undefined"){
	    win = self;
	} else {
	    win = {};
	}

	module.exports = win;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 71 */
/***/ (function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/**
	 * Module exports.
	 */

	module.exports = deprecate;

	/**
	 * Mark that a method should not be used.
	 * Returns a modified function which warns once by default.
	 *
	 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
	 *
	 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
	 * will throw an Error when invoked.
	 *
	 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
	 * will invoke `console.trace()` instead of `console.error()`.
	 *
	 * @param {Function} fn - the function to deprecate
	 * @param {String} msg - the string to print to the console when `fn` is invoked
	 * @returns {Function} a new "deprecated" version of `fn`
	 * @api public
	 */

	function deprecate (fn, msg) {
	  if (config('noDeprecation')) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (config('throwDeprecation')) {
	        throw new Error(msg);
	      } else if (config('traceDeprecation')) {
	        console.trace(msg);
	      } else {
	        console.warn(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	}

	/**
	 * Checks `localStorage` for boolean values for the given `name`.
	 *
	 * @param {String} name
	 * @returns {Boolean}
	 * @api private
	 */

	function config (name) {
	  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
	  try {
	    if (!global.localStorage) return false;
	  } catch (_) {
	    return false;
	  }
	  var val = global.localStorage[name];
	  if (null == val) return false;
	  return String(val).toLowerCase() === 'true';
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	/*</replacement>*/

	var isEncoding = Buffer.isEncoding || function (encoding) {
	  encoding = '' + encoding;
	  switch (encoding && encoding.toLowerCase()) {
	    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
	      return true;
	    default:
	      return false;
	  }
	};

	function _normalizeEncoding(enc) {
	  if (!enc) return 'utf8';
	  var retried;
	  while (true) {
	    switch (enc) {
	      case 'utf8':
	      case 'utf-8':
	        return 'utf8';
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return 'utf16le';
	      case 'latin1':
	      case 'binary':
	        return 'latin1';
	      case 'base64':
	      case 'ascii':
	      case 'hex':
	        return enc;
	      default:
	        if (retried) return; // undefined
	        enc = ('' + enc).toLowerCase();
	        retried = true;
	    }
	  }
	};

	// Do not cache `Buffer.isEncoding` when checking encoding names as some
	// modules monkey-patch it to support additional encodings
	function normalizeEncoding(enc) {
	  var nenc = _normalizeEncoding(enc);
	  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
	  return nenc || enc;
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters.
	exports.StringDecoder = StringDecoder;
	function StringDecoder(encoding) {
	  this.encoding = normalizeEncoding(encoding);
	  var nb;
	  switch (this.encoding) {
	    case 'utf16le':
	      this.text = utf16Text;
	      this.end = utf16End;
	      nb = 4;
	      break;
	    case 'utf8':
	      this.fillLast = utf8FillLast;
	      nb = 4;
	      break;
	    case 'base64':
	      this.text = base64Text;
	      this.end = base64End;
	      nb = 3;
	      break;
	    default:
	      this.write = simpleWrite;
	      this.end = simpleEnd;
	      return;
	  }
	  this.lastNeed = 0;
	  this.lastTotal = 0;
	  this.lastChar = Buffer.allocUnsafe(nb);
	}

	StringDecoder.prototype.write = function (buf) {
	  if (buf.length === 0) return '';
	  var r;
	  var i;
	  if (this.lastNeed) {
	    r = this.fillLast(buf);
	    if (r === undefined) return '';
	    i = this.lastNeed;
	    this.lastNeed = 0;
	  } else {
	    i = 0;
	  }
	  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
	  return r || '';
	};

	StringDecoder.prototype.end = utf8End;

	// Returns only complete characters in a Buffer
	StringDecoder.prototype.text = utf8Text;

	// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
	StringDecoder.prototype.fillLast = function (buf) {
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
	  this.lastNeed -= buf.length;
	};

	// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
	// continuation byte. If an invalid byte is detected, -2 is returned.
	function utf8CheckByte(byte) {
	  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
	  return byte >> 6 === 0x02 ? -1 : -2;
	}

	// Checks at most 3 bytes at the end of a Buffer in order to detect an
	// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
	// needed to complete the UTF-8 character (if applicable) are returned.
	function utf8CheckIncomplete(self, buf, i) {
	  var j = buf.length - 1;
	  if (j < i) return 0;
	  var nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 1;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 2;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) {
	      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
	    }
	    return nb;
	  }
	  return 0;
	}

	// Validates as many continuation bytes for a multi-byte UTF-8 character as
	// needed or are available. If we see a non-continuation byte where we expect
	// one, we "replace" the validated continuation bytes we've seen so far with
	// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
	// behavior. The continuation byte check is included three times in the case
	// where all of the continuation bytes for a character exist in the same buffer.
	// It is also done this way as a slight performance increase instead of using a
	// loop.
	function utf8CheckExtraBytes(self, buf, p) {
	  if ((buf[0] & 0xC0) !== 0x80) {
	    self.lastNeed = 0;
	    return '\ufffd';
	  }
	  if (self.lastNeed > 1 && buf.length > 1) {
	    if ((buf[1] & 0xC0) !== 0x80) {
	      self.lastNeed = 1;
	      return '\ufffd';
	    }
	    if (self.lastNeed > 2 && buf.length > 2) {
	      if ((buf[2] & 0xC0) !== 0x80) {
	        self.lastNeed = 2;
	        return '\ufffd';
	      }
	    }
	  }
	}

	// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
	function utf8FillLast(buf) {
	  var p = this.lastTotal - this.lastNeed;
	  var r = utf8CheckExtraBytes(this, buf, p);
	  if (r !== undefined) return r;
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, p, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, p, 0, buf.length);
	  this.lastNeed -= buf.length;
	}

	// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
	// partial character, the character's bytes are buffered until the required
	// number of bytes are available.
	function utf8Text(buf, i) {
	  var total = utf8CheckIncomplete(this, buf, i);
	  if (!this.lastNeed) return buf.toString('utf8', i);
	  this.lastTotal = total;
	  var end = buf.length - (total - this.lastNeed);
	  buf.copy(this.lastChar, 0, end);
	  return buf.toString('utf8', i, end);
	}

	// For UTF-8, a replacement character is added when ending on a partial
	// character.
	function utf8End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + '\ufffd';
	  return r;
	}

	// UTF-16LE typically needs two bytes per character, but even if we have an even
	// number of bytes available, we need to check if we end on a leading/high
	// surrogate. In that case, we need to wait for the next two bytes in order to
	// decode the last character properly.
	function utf16Text(buf, i) {
	  if ((buf.length - i) % 2 === 0) {
	    var r = buf.toString('utf16le', i);
	    if (r) {
	      var c = r.charCodeAt(r.length - 1);
	      if (c >= 0xD800 && c <= 0xDBFF) {
	        this.lastNeed = 2;
	        this.lastTotal = 4;
	        this.lastChar[0] = buf[buf.length - 2];
	        this.lastChar[1] = buf[buf.length - 1];
	        return r.slice(0, -1);
	      }
	    }
	    return r;
	  }
	  this.lastNeed = 1;
	  this.lastTotal = 2;
	  this.lastChar[0] = buf[buf.length - 1];
	  return buf.toString('utf16le', i, buf.length - 1);
	}

	// For UTF-16LE we do not explicitly append special replacement characters if we
	// end on a partial character, we simply let v8 handle that.
	function utf16End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) {
	    var end = this.lastTotal - this.lastNeed;
	    return r + this.lastChar.toString('utf16le', 0, end);
	  }
	  return r;
	}

	function base64Text(buf, i) {
	  var n = (buf.length - i) % 3;
	  if (n === 0) return buf.toString('base64', i);
	  this.lastNeed = 3 - n;
	  this.lastTotal = 3;
	  if (n === 1) {
	    this.lastChar[0] = buf[buf.length - 1];
	  } else {
	    this.lastChar[0] = buf[buf.length - 2];
	    this.lastChar[1] = buf[buf.length - 1];
	  }
	  return buf.toString('base64', i, buf.length - n);
	}

	function base64End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
	  return r;
	}

	// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
	function simpleWrite(buf) {
	  return buf.toString(this.encoding);
	}

	function simpleEnd(buf) {
	  return buf && buf.length ? this.write(buf) : '';
	}

/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	'use strict';

	module.exports = Transform;

	var Duplex = __webpack_require__(66);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(Transform, Duplex);

	function afterTransform(er, data) {
	  var ts = this._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb) {
	    return this.emit('error', new Error('write callback called multiple times'));
	  }

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (data != null) // single equals check for both `null` and `undefined`
	    this.push(data);

	  cb(er);

	  var rs = this._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    this._read(rs.highWaterMark);
	  }
	}

	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = {
	    afterTransform: afterTransform.bind(this),
	    needTransform: false,
	    transforming: false,
	    writecb: null,
	    writechunk: null,
	    writeencoding: null
	  };

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;

	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }

	  // When the writable side finishes, then flush out anything remaining.
	  this.on('prefinish', prefinish);
	}

	function prefinish() {
	  var _this = this;

	  if (typeof this._flush === 'function') {
	    this._flush(function (er, data) {
	      done(_this, er, data);
	    });
	  } else {
	    done(this, null, null);
	  }
	}

	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('_transform() is not implemented');
	};

	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;

	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};

	Transform.prototype._destroy = function (err, cb) {
	  var _this2 = this;

	  Duplex.prototype._destroy.call(this, err, function (err2) {
	    cb(err2);
	    _this2.emit('close');
	  });
	};

	function done(stream, er, data) {
	  if (er) return stream.emit('error', er);

	  if (data != null) // single equals check for both `null` and `undefined`
	    stream.push(data);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

	  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

	  return stream.push(null);
	}

/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	'use strict';

	module.exports = PassThrough;

	var Transform = __webpack_require__(73);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(76)() ? Map : __webpack_require__(77);


/***/ }),
/* 76 */
/***/ (function(module, exports) {

	'use strict';

	module.exports = function () {
		var map, iterator, result;
		if (typeof Map !== 'function') return false;
		try {
			// WebKit doesn't support arguments and crashes
			map = new Map([['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]);
		} catch (e) {
			return false;
		}
		if (String(map) !== '[object Map]') return false;
		if (map.size !== 3) return false;
		if (typeof map.clear !== 'function') return false;
		if (typeof map.delete !== 'function') return false;
		if (typeof map.entries !== 'function') return false;
		if (typeof map.forEach !== 'function') return false;
		if (typeof map.get !== 'function') return false;
		if (typeof map.has !== 'function') return false;
		if (typeof map.keys !== 'function') return false;
		if (typeof map.set !== 'function') return false;
		if (typeof map.values !== 'function') return false;

		iterator = map.entries();
		result = iterator.next();
		if (result.done !== false) return false;
		if (!result.value) return false;
		if (result.value[0] !== 'raz') return false;
		if (result.value[1] !== 'one') return false;

		return true;
	};


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var clear          = __webpack_require__(78)
	  , eIndexOf       = __webpack_require__(82)
	  , setPrototypeOf = __webpack_require__(91)
	  , callable       = __webpack_require__(96)
	  , validValue     = __webpack_require__(79)
	  , d              = __webpack_require__(97)
	  , ee             = __webpack_require__(109)
	  , Symbol         = __webpack_require__(110)
	  , iterator       = __webpack_require__(115)
	  , forOf          = __webpack_require__(119)
	  , Iterator       = __webpack_require__(133)
	  , isNative       = __webpack_require__(136)

	  , call = Function.prototype.call
	  , defineProperties = Object.defineProperties, getPrototypeOf = Object.getPrototypeOf
	  , MapPoly;

	module.exports = MapPoly = function (/*iterable*/) {
		var iterable = arguments[0], keys, values, self;
		if (!(this instanceof MapPoly)) throw new TypeError('Constructor requires \'new\'');
		if (isNative && setPrototypeOf && (Map !== MapPoly)) {
			self = setPrototypeOf(new Map(), getPrototypeOf(this));
		} else {
			self = this;
		}
		if (iterable != null) iterator(iterable);
		defineProperties(self, {
			__mapKeysData__: d('c', keys = []),
			__mapValuesData__: d('c', values = [])
		});
		if (!iterable) return self;
		forOf(iterable, function (value) {
			var key = validValue(value)[0];
			value = value[1];
			if (eIndexOf.call(keys, key) !== -1) return;
			keys.push(key);
			values.push(value);
		}, self);
		return self;
	};

	if (isNative) {
		if (setPrototypeOf) setPrototypeOf(MapPoly, Map);
		MapPoly.prototype = Object.create(Map.prototype, {
			constructor: d(MapPoly)
		});
	}

	ee(defineProperties(MapPoly.prototype, {
		clear: d(function () {
			if (!this.__mapKeysData__.length) return;
			clear.call(this.__mapKeysData__);
			clear.call(this.__mapValuesData__);
			this.emit('_clear');
		}),
		delete: d(function (key) {
			var index = eIndexOf.call(this.__mapKeysData__, key);
			if (index === -1) return false;
			this.__mapKeysData__.splice(index, 1);
			this.__mapValuesData__.splice(index, 1);
			this.emit('_delete', index, key);
			return true;
		}),
		entries: d(function () { return new Iterator(this, 'key+value'); }),
		forEach: d(function (cb/*, thisArg*/) {
			var thisArg = arguments[1], iterator, result;
			callable(cb);
			iterator = this.entries();
			result = iterator._next();
			while (result !== undefined) {
				call.call(cb, thisArg, this.__mapValuesData__[result],
					this.__mapKeysData__[result], this);
				result = iterator._next();
			}
		}),
		get: d(function (key) {
			var index = eIndexOf.call(this.__mapKeysData__, key);
			if (index === -1) return;
			return this.__mapValuesData__[index];
		}),
		has: d(function (key) {
			return (eIndexOf.call(this.__mapKeysData__, key) !== -1);
		}),
		keys: d(function () { return new Iterator(this, 'key'); }),
		set: d(function (key, value) {
			var index = eIndexOf.call(this.__mapKeysData__, key), emit;
			if (index === -1) {
				index = this.__mapKeysData__.push(key) - 1;
				emit = true;
			}
			this.__mapValuesData__[index] = value;
			if (emit) this.emit('_add', index, key);
			return this;
		}),
		size: d.gs(function () { return this.__mapKeysData__.length; }),
		values: d(function () { return new Iterator(this, 'value'); }),
		toString: d(function () { return '[object Map]'; })
	}));
	Object.defineProperty(MapPoly.prototype, Symbol.iterator, d(function () {
		return this.entries();
	}));
	Object.defineProperty(MapPoly.prototype, Symbol.toStringTag, d('c', 'Map'));


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

	// Inspired by Google Closure:
	// http://closure-library.googlecode.com/svn/docs/
	// closure_goog_array_array.js.html#goog.array.clear

	"use strict";

	var value = __webpack_require__(79);

	module.exports = function () {
		value(this).length = 0;
		return this;
	};


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isValue = __webpack_require__(80);

	module.exports = function (value) {
		if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
		return value;
	};


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var _undefined = __webpack_require__(81)(); // Support ES3 engines

	module.exports = function (val) {
	 return (val !== _undefined) && (val !== null);
	};


/***/ }),
/* 81 */
/***/ (function(module, exports) {

	"use strict";

	// eslint-disable-next-line no-empty-function
	module.exports = function () {};


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var numberIsNaN       = __webpack_require__(83)
	  , toPosInt          = __webpack_require__(86)
	  , value             = __webpack_require__(79)
	  , indexOf           = Array.prototype.indexOf
	  , objHasOwnProperty = Object.prototype.hasOwnProperty
	  , abs               = Math.abs
	  , floor             = Math.floor;

	module.exports = function (searchElement /*, fromIndex*/) {
		var i, length, fromIndex, val;
		if (!numberIsNaN(searchElement)) return indexOf.apply(this, arguments);

		length = toPosInt(value(this).length);
		fromIndex = arguments[1];
		if (isNaN(fromIndex)) fromIndex = 0;
		else if (fromIndex >= 0) fromIndex = floor(fromIndex);
		else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

		for (i = fromIndex; i < length; ++i) {
			if (objHasOwnProperty.call(this, i)) {
				val = this[i];
				if (numberIsNaN(val)) return i; // Jslint: ignore
			}
		}
		return -1;
	};


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(84)()
		? Number.isNaN
		: __webpack_require__(85);


/***/ }),
/* 84 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function () {
		var numberIsNaN = Number.isNaN;
		if (typeof numberIsNaN !== "function") return false;
		return !numberIsNaN({}) && numberIsNaN(NaN) && !numberIsNaN(34);
	};


/***/ }),
/* 85 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function (value) {
		// eslint-disable-next-line no-self-compare
		return value !== value;
	};


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var toInteger = __webpack_require__(87)

	  , max = Math.max;

	module.exports = function (value) {
	 return max(0, toInteger(value));
	};


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var sign = __webpack_require__(88)

	  , abs = Math.abs, floor = Math.floor;

	module.exports = function (value) {
		if (isNaN(value)) return 0;
		value = Number(value);
		if ((value === 0) || !isFinite(value)) return value;
		return sign(value) * floor(abs(value));
	};


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(89)()
		? Math.sign
		: __webpack_require__(90);


/***/ }),
/* 89 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function () {
		var sign = Math.sign;
		if (typeof sign !== "function") return false;
		return (sign(10) === 1) && (sign(-20) === -1);
	};


/***/ }),
/* 90 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function (value) {
		value = Number(value);
		if (isNaN(value) || (value === 0)) return value;
		return value > 0 ? 1 : -1;
	};


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(92)()
		? Object.setPrototypeOf
		: __webpack_require__(93);


/***/ }),
/* 92 */
/***/ (function(module, exports) {

	"use strict";

	var create = Object.create, getPrototypeOf = Object.getPrototypeOf, plainObject = {};

	module.exports = function (/* CustomCreate*/) {
		var setPrototypeOf = Object.setPrototypeOf, customCreate = arguments[0] || create;
		if (typeof setPrototypeOf !== "function") return false;
		return getPrototypeOf(setPrototypeOf(customCreate(null), plainObject)) === plainObject;
	};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

	/* eslint no-proto: "off" */

	// Big thanks to @WebReflection for sorting this out
	// https://gist.github.com/WebReflection/5593554

	"use strict";

	var isObject        = __webpack_require__(94)
	  , value           = __webpack_require__(79)
	  , objIsPrototypeOf = Object.prototype.isPrototypeOf
	  , defineProperty  = Object.defineProperty
	  , nullDesc        = {
		configurable: true,
		enumerable: false,
		writable: true,
		value: undefined
	}
	  , validate;

	validate = function (obj, prototype) {
		value(obj);
		if (prototype === null || isObject(prototype)) return obj;
		throw new TypeError("Prototype must be null or an object");
	};

	module.exports = (function (status) {
		var fn, set;
		if (!status) return null;
		if (status.level === 2) {
			if (status.set) {
				set = status.set;
				fn = function (obj, prototype) {
					set.call(validate(obj, prototype), prototype);
					return obj;
				};
			} else {
				fn = function (obj, prototype) {
					validate(obj, prototype).__proto__ = prototype;
					return obj;
				};
			}
		} else {
			fn = function self(obj, prototype) {
				var isNullBase;
				validate(obj, prototype);
				isNullBase = objIsPrototypeOf.call(self.nullPolyfill, obj);
				if (isNullBase) delete self.nullPolyfill.__proto__;
				if (prototype === null) prototype = self.nullPolyfill;
				obj.__proto__ = prototype;
				if (isNullBase) defineProperty(self.nullPolyfill, "__proto__", nullDesc);
				return obj;
			};
		}
		return Object.defineProperty(fn, "level", {
			configurable: false,
			enumerable: false,
			writable: false,
			value: status.level
		});
	}(
		(function () {
			var tmpObj1 = Object.create(null)
			  , tmpObj2 = {}
			  , set
			  , desc = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__");

			if (desc) {
				try {
					set = desc.set; // Opera crashes at this point
					set.call(tmpObj1, tmpObj2);
				} catch (ignore) {}
				if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { set: set, level: 2 };
			}

			tmpObj1.__proto__ = tmpObj2;
			if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 2 };

			tmpObj1 = {};
			tmpObj1.__proto__ = tmpObj2;
			if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 1 };

			return false;
		})()
	));

	__webpack_require__(95);


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isValue = __webpack_require__(80);

	var map = { function: true, object: true };

	module.exports = function (value) {
		return (isValue(value) && map[typeof value]) || false;
	};


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

	// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

	"use strict";

	var create = Object.create, shim;

	if (!__webpack_require__(92)()) {
		shim = __webpack_require__(93);
	}

	module.exports = (function () {
		var nullObject, polyProps, desc;
		if (!shim) return create;
		if (shim.level !== 1) return create;

		nullObject = {};
		polyProps = {};
		desc = {
			configurable: false,
			enumerable: false,
			writable: true,
			value: undefined
		};
		Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
			if (name === "__proto__") {
				polyProps[name] = {
					configurable: true,
					enumerable: false,
					writable: true,
					value: undefined
				};
				return;
			}
			polyProps[name] = desc;
		});
		Object.defineProperties(nullObject, polyProps);

		Object.defineProperty(shim, "nullPolyfill", {
			configurable: false,
			enumerable: false,
			writable: false,
			value: nullObject
		});

		return function (prototype, props) {
			return create(prototype === null ? nullObject : prototype, props);
		};
	}());


/***/ }),
/* 96 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function (fn) {
		if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
		return fn;
	};


/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var assign        = __webpack_require__(98)
	  , normalizeOpts = __webpack_require__(104)
	  , isCallable    = __webpack_require__(105)
	  , contains      = __webpack_require__(106)

	  , d;

	d = module.exports = function (dscr, value/*, options*/) {
		var c, e, w, options, desc;
		if ((arguments.length < 2) || (typeof dscr !== 'string')) {
			options = value;
			value = dscr;
			dscr = null;
		} else {
			options = arguments[2];
		}
		if (dscr == null) {
			c = w = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
			w = contains.call(dscr, 'w');
		}

		desc = { value: value, configurable: c, enumerable: e, writable: w };
		return !options ? desc : assign(normalizeOpts(options), desc);
	};

	d.gs = function (dscr, get, set/*, options*/) {
		var c, e, options, desc;
		if (typeof dscr !== 'string') {
			options = set;
			set = get;
			get = dscr;
			dscr = null;
		} else {
			options = arguments[3];
		}
		if (get == null) {
			get = undefined;
		} else if (!isCallable(get)) {
			options = get;
			get = set = undefined;
		} else if (set == null) {
			set = undefined;
		} else if (!isCallable(set)) {
			options = set;
			set = undefined;
		}
		if (dscr == null) {
			c = true;
			e = false;
		} else {
			c = contains.call(dscr, 'c');
			e = contains.call(dscr, 'e');
		}

		desc = { get: get, set: set, configurable: c, enumerable: e };
		return !options ? desc : assign(normalizeOpts(options), desc);
	};


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(99)()
		? Object.assign
		: __webpack_require__(100);


/***/ }),
/* 99 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function () {
		var assign = Object.assign, obj;
		if (typeof assign !== "function") return false;
		obj = { foo: "raz" };
		assign(obj, { bar: "dwa" }, { trzy: "trzy" });
		return (obj.foo + obj.bar + obj.trzy) === "razdwatrzy";
	};


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var keys  = __webpack_require__(101)
	  , value = __webpack_require__(79)
	  , max   = Math.max;

	module.exports = function (dest, src /*, ???srcn*/) {
		var error, i, length = max(arguments.length, 2), assign;
		dest = Object(value(dest));
		assign = function (key) {
			try {
				dest[key] = src[key];
			} catch (e) {
				if (!error) error = e;
			}
		};
		for (i = 1; i < length; ++i) {
			src = arguments[i];
			keys(src).forEach(assign);
		}
		if (error !== undefined) throw error;
		return dest;
	};


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(102)() ? Object.keys : __webpack_require__(103);


/***/ }),
/* 102 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function () {
		try {
			Object.keys("primitive");
			return true;
		} catch (e) {
			return false;
		}
	};


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isValue = __webpack_require__(80);

	var keys = Object.keys;

	module.exports = function (object) { return keys(isValue(object) ? Object(object) : object); };


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isValue = __webpack_require__(80);

	var forEach = Array.prototype.forEach, create = Object.create;

	var process = function (src, obj) {
		var key;
		for (key in src) obj[key] = src[key];
	};

	// eslint-disable-next-line no-unused-vars
	module.exports = function (opts1 /*, ???options*/) {
		var result = create(null);
		forEach.call(arguments, function (options) {
			if (!isValue(options)) return;
			process(Object(options), result);
		});
		return result;
	};


/***/ }),
/* 105 */
/***/ (function(module, exports) {

	// Deprecated

	"use strict";

	module.exports = function (obj) {
	 return typeof obj === "function";
	};


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(107)()
		? String.prototype.contains
		: __webpack_require__(108);


/***/ }),
/* 107 */
/***/ (function(module, exports) {

	"use strict";

	var str = "razdwatrzy";

	module.exports = function () {
		if (typeof str.contains !== "function") return false;
		return (str.contains("dwa") === true) && (str.contains("foo") === false);
	};


/***/ }),
/* 108 */
/***/ (function(module, exports) {

	"use strict";

	var indexOf = String.prototype.indexOf;

	module.exports = function (searchString/*, position*/) {
		return indexOf.call(this, searchString, arguments[1]) > -1;
	};


/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var d        = __webpack_require__(97)
	  , callable = __webpack_require__(96)

	  , apply = Function.prototype.apply, call = Function.prototype.call
	  , create = Object.create, defineProperty = Object.defineProperty
	  , defineProperties = Object.defineProperties
	  , hasOwnProperty = Object.prototype.hasOwnProperty
	  , descriptor = { configurable: true, enumerable: false, writable: true }

	  , on, once, off, emit, methods, descriptors, base;

	on = function (type, listener) {
		var data;

		callable(listener);

		if (!hasOwnProperty.call(this, '__ee__')) {
			data = descriptor.value = create(null);
			defineProperty(this, '__ee__', descriptor);
			descriptor.value = null;
		} else {
			data = this.__ee__;
		}
		if (!data[type]) data[type] = listener;
		else if (typeof data[type] === 'object') data[type].push(listener);
		else data[type] = [data[type], listener];

		return this;
	};

	once = function (type, listener) {
		var once, self;

		callable(listener);
		self = this;
		on.call(this, type, once = function () {
			off.call(self, type, once);
			apply.call(listener, this, arguments);
		});

		once.__eeOnceListener__ = listener;
		return this;
	};

	off = function (type, listener) {
		var data, listeners, candidate, i;

		callable(listener);

		if (!hasOwnProperty.call(this, '__ee__')) return this;
		data = this.__ee__;
		if (!data[type]) return this;
		listeners = data[type];

		if (typeof listeners === 'object') {
			for (i = 0; (candidate = listeners[i]); ++i) {
				if ((candidate === listener) ||
						(candidate.__eeOnceListener__ === listener)) {
					if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
					else listeners.splice(i, 1);
				}
			}
		} else {
			if ((listeners === listener) ||
					(listeners.__eeOnceListener__ === listener)) {
				delete data[type];
			}
		}

		return this;
	};

	emit = function (type) {
		var i, l, listener, listeners, args;

		if (!hasOwnProperty.call(this, '__ee__')) return;
		listeners = this.__ee__[type];
		if (!listeners) return;

		if (typeof listeners === 'object') {
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

			listeners = listeners.slice();
			for (i = 0; (listener = listeners[i]); ++i) {
				apply.call(listener, this, args);
			}
		} else {
			switch (arguments.length) {
			case 1:
				call.call(listeners, this);
				break;
			case 2:
				call.call(listeners, this, arguments[1]);
				break;
			case 3:
				call.call(listeners, this, arguments[1], arguments[2]);
				break;
			default:
				l = arguments.length;
				args = new Array(l - 1);
				for (i = 1; i < l; ++i) {
					args[i - 1] = arguments[i];
				}
				apply.call(listeners, this, args);
			}
		}
	};

	methods = {
		on: on,
		once: once,
		off: off,
		emit: emit
	};

	descriptors = {
		on: d(on),
		once: d(once),
		off: d(off),
		emit: d(emit)
	};

	base = defineProperties({}, descriptors);

	module.exports = exports = function (o) {
		return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
	};
	exports.methods = methods;


/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(111)() ? Symbol : __webpack_require__(112);


/***/ }),
/* 111 */
/***/ (function(module, exports) {

	'use strict';

	var validTypes = { object: true, symbol: true };

	module.exports = function () {
		var symbol;
		if (typeof Symbol !== 'function') return false;
		symbol = Symbol('test symbol');
		try { String(symbol); } catch (e) { return false; }

		// Return 'true' also for polyfills
		if (!validTypes[typeof Symbol.iterator]) return false;
		if (!validTypes[typeof Symbol.toPrimitive]) return false;
		if (!validTypes[typeof Symbol.toStringTag]) return false;

		return true;
	};


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

	// ES2015 Symbol polyfill for environments that do not (or partially) support it

	'use strict';

	var d              = __webpack_require__(97)
	  , validateSymbol = __webpack_require__(113)

	  , create = Object.create, defineProperties = Object.defineProperties
	  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
	  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null)
	  , isNativeSafe;

	if (typeof Symbol === 'function') {
		NativeSymbol = Symbol;
		try {
			String(NativeSymbol());
			isNativeSafe = true;
		} catch (ignore) {}
	}

	var generateName = (function () {
		var created = create(null);
		return function (desc) {
			var postfix = 0, name, ie11BugWorkaround;
			while (created[desc + (postfix || '')]) ++postfix;
			desc += (postfix || '');
			created[desc] = true;
			name = '@@' + desc;
			defineProperty(objPrototype, name, d.gs(null, function (value) {
				// For IE11 issue see:
				// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
				//    ie11-broken-getters-on-dom-objects
				// https://github.com/medikoo/es6-symbol/issues/12
				if (ie11BugWorkaround) return;
				ie11BugWorkaround = true;
				defineProperty(this, name, d(value));
				ie11BugWorkaround = false;
			}));
			return name;
		};
	}());

	// Internal constructor (not one exposed) for creating Symbol instances.
	// This one is used to ensure that `someSymbol instanceof Symbol` always return false
	HiddenSymbol = function Symbol(description) {
		if (this instanceof HiddenSymbol) throw new TypeError('Symbol is not a constructor');
		return SymbolPolyfill(description);
	};

	// Exposed `Symbol` constructor
	// (returns instances of HiddenSymbol)
	module.exports = SymbolPolyfill = function Symbol(description) {
		var symbol;
		if (this instanceof Symbol) throw new TypeError('Symbol is not a constructor');
		if (isNativeSafe) return NativeSymbol(description);
		symbol = create(HiddenSymbol.prototype);
		description = (description === undefined ? '' : String(description));
		return defineProperties(symbol, {
			__description__: d('', description),
			__name__: d('', generateName(description))
		});
	};
	defineProperties(SymbolPolyfill, {
		for: d(function (key) {
			if (globalSymbols[key]) return globalSymbols[key];
			return (globalSymbols[key] = SymbolPolyfill(String(key)));
		}),
		keyFor: d(function (s) {
			var key;
			validateSymbol(s);
			for (key in globalSymbols) if (globalSymbols[key] === s) return key;
		}),

		// To ensure proper interoperability with other native functions (e.g. Array.from)
		// fallback to eventual native implementation of given symbol
		hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
		isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
			SymbolPolyfill('isConcatSpreadable')),
		iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
		match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
		replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
		search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
		species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
		split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
		toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
		toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
		unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
	});

	// Internal tweaks for real symbol producer
	defineProperties(HiddenSymbol.prototype, {
		constructor: d(SymbolPolyfill),
		toString: d('', function () { return this.__name__; })
	});

	// Proper implementation of methods exposed on Symbol.prototype
	// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
	defineProperties(SymbolPolyfill.prototype, {
		toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
		valueOf: d(function () { return validateSymbol(this); })
	});
	defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
		var symbol = validateSymbol(this);
		if (typeof symbol === 'symbol') return symbol;
		return symbol.toString();
	}));
	defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

	// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
	defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
		d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

	// Note: It's important to define `toPrimitive` as last one, as some implementations
	// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
	// And that may invoke error in definition flow:
	// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
	defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
		d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var isSymbol = __webpack_require__(114);

	module.exports = function (value) {
		if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
		return value;
	};


/***/ }),
/* 114 */
/***/ (function(module, exports) {

	'use strict';

	module.exports = function (x) {
		if (!x) return false;
		if (typeof x === 'symbol') return true;
		if (!x.constructor) return false;
		if (x.constructor.name !== 'Symbol') return false;
		return (x[x.constructor.toStringTag] === 'Symbol');
	};


/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isIterable = __webpack_require__(116);

	module.exports = function (value) {
		if (!isIterable(value)) throw new TypeError(value + " is not iterable");
		return value;
	};


/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isArguments = __webpack_require__(117)
	  , isValue     = __webpack_require__(80)
	  , isString    = __webpack_require__(118);

	var iteratorSymbol = __webpack_require__(110).iterator
	  , isArray        = Array.isArray;

	module.exports = function (value) {
		if (!isValue(value)) return false;
		if (isArray(value)) return true;
		if (isString(value)) return true;
		if (isArguments(value)) return true;
		return typeof value[iteratorSymbol] === "function";
	};


/***/ }),
/* 117 */
/***/ (function(module, exports) {

	"use strict";

	var objToString = Object.prototype.toString
	  , id = objToString.call(
		(function () {
			return arguments;
		})()
	);

	module.exports = function (value) {
		return objToString.call(value) === id;
	};


/***/ }),
/* 118 */
/***/ (function(module, exports) {

	"use strict";

	var objToString = Object.prototype.toString, id = objToString.call("");

	module.exports = function (value) {
		return (
			typeof value === "string" ||
			(value &&
				typeof value === "object" &&
				(value instanceof String || objToString.call(value) === id)) ||
			false
		);
	};


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isArguments = __webpack_require__(117)
	  , callable    = __webpack_require__(96)
	  , isString    = __webpack_require__(118)
	  , get         = __webpack_require__(120);

	var isArray = Array.isArray, call = Function.prototype.call, some = Array.prototype.some;

	module.exports = function (iterable, cb /*, thisArg*/) {
		var mode, thisArg = arguments[2], result, doBreak, broken, i, length, char, code;
		if (isArray(iterable) || isArguments(iterable)) mode = "array";
		else if (isString(iterable)) mode = "string";
		else iterable = get(iterable);

		callable(cb);
		doBreak = function () {
			broken = true;
		};
		if (mode === "array") {
			some.call(iterable, function (value) {
				call.call(cb, thisArg, value, doBreak);
				return broken;
			});
			return;
		}
		if (mode === "string") {
			length = iterable.length;
			for (i = 0; i < length; ++i) {
				char = iterable[i];
				if (i + 1 < length) {
					code = char.charCodeAt(0);
					if (code >= 0xd800 && code <= 0xdbff) char += iterable[++i];
				}
				call.call(cb, thisArg, char, doBreak);
				if (broken) break;
			}
			return;
		}
		result = iterable.next();

		while (!result.done) {
			call.call(cb, thisArg, result.value, doBreak);
			if (broken) return;
			result = iterable.next();
		}
	};


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var isArguments    = __webpack_require__(117)
	  , isString       = __webpack_require__(118)
	  , ArrayIterator  = __webpack_require__(121)
	  , StringIterator = __webpack_require__(132)
	  , iterable       = __webpack_require__(115)
	  , iteratorSymbol = __webpack_require__(110).iterator;

	module.exports = function (obj) {
		if (typeof iterable(obj)[iteratorSymbol] === "function") return obj[iteratorSymbol]();
		if (isArguments(obj)) return new ArrayIterator(obj);
		if (isString(obj)) return new StringIterator(obj);
		return new ArrayIterator(obj);
	};


/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var setPrototypeOf = __webpack_require__(91)
	  , contains       = __webpack_require__(106)
	  , d              = __webpack_require__(97)
	  , Symbol         = __webpack_require__(110)
	  , Iterator       = __webpack_require__(122);

	var defineProperty = Object.defineProperty, ArrayIterator;

	ArrayIterator = module.exports = function (arr, kind) {
		if (!(this instanceof ArrayIterator)) throw new TypeError("Constructor requires 'new'");
		Iterator.call(this, arr);
		if (!kind) kind = "value";
		else if (contains.call(kind, "key+value")) kind = "key+value";
		else if (contains.call(kind, "key")) kind = "key";
		else kind = "value";
		defineProperty(this, "__kind__", d("", kind));
	};
	if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

	// Internal %ArrayIteratorPrototype% doesn't expose its constructor
	delete ArrayIterator.prototype.constructor;

	ArrayIterator.prototype = Object.create(Iterator.prototype, {
		_resolve: d(function (i) {
			if (this.__kind__ === "value") return this.__list__[i];
			if (this.__kind__ === "key+value") return [i, this.__list__[i]];
			return i;
		})
	});
	defineProperty(ArrayIterator.prototype, Symbol.toStringTag, d("c", "Array Iterator"));


/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var clear    = __webpack_require__(78)
	  , assign   = __webpack_require__(98)
	  , callable = __webpack_require__(96)
	  , value    = __webpack_require__(79)
	  , d        = __webpack_require__(97)
	  , autoBind = __webpack_require__(123)
	  , Symbol   = __webpack_require__(110);

	var defineProperty = Object.defineProperty, defineProperties = Object.defineProperties, Iterator;

	module.exports = Iterator = function (list, context) {
		if (!(this instanceof Iterator)) throw new TypeError("Constructor requires 'new'");
		defineProperties(this, {
			__list__: d("w", value(list)),
			__context__: d("w", context),
			__nextIndex__: d("w", 0)
		});
		if (!context) return;
		callable(context.on);
		context.on("_add", this._onAdd);
		context.on("_delete", this._onDelete);
		context.on("_clear", this._onClear);
	};

	// Internal %IteratorPrototype% doesn't expose its constructor
	delete Iterator.prototype.constructor;

	defineProperties(
		Iterator.prototype,
		assign(
			{
				_next: d(function () {
					var i;
					if (!this.__list__) return undefined;
					if (this.__redo__) {
						i = this.__redo__.shift();
						if (i !== undefined) return i;
					}
					if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
					this._unBind();
					return undefined;
				}),
				next: d(function () {
					return this._createResult(this._next());
				}),
				_createResult: d(function (i) {
					if (i === undefined) return { done: true, value: undefined };
					return { done: false, value: this._resolve(i) };
				}),
				_resolve: d(function (i) {
					return this.__list__[i];
				}),
				_unBind: d(function () {
					this.__list__ = null;
					delete this.__redo__;
					if (!this.__context__) return;
					this.__context__.off("_add", this._onAdd);
					this.__context__.off("_delete", this._onDelete);
					this.__context__.off("_clear", this._onClear);
					this.__context__ = null;
				}),
				toString: d(function () {
					return "[object " + (this[Symbol.toStringTag] || "Object") + "]";
				})
			},
			autoBind({
				_onAdd: d(function (index) {
					if (index >= this.__nextIndex__) return;
					++this.__nextIndex__;
					if (!this.__redo__) {
						defineProperty(this, "__redo__", d("c", [index]));
						return;
					}
					this.__redo__.forEach(function (redo, i) {
						if (redo >= index) this.__redo__[i] = ++redo;
					}, this);
					this.__redo__.push(index);
				}),
				_onDelete: d(function (index) {
					var i;
					if (index >= this.__nextIndex__) return;
					--this.__nextIndex__;
					if (!this.__redo__) return;
					i = this.__redo__.indexOf(index);
					if (i !== -1) this.__redo__.splice(i, 1);
					this.__redo__.forEach(function (redo, j) {
						if (redo > index) this.__redo__[j] = --redo;
					}, this);
				}),
				_onClear: d(function () {
					if (this.__redo__) clear.call(this.__redo__);
					this.__nextIndex__ = 0;
				})
			})
		)
	);

	defineProperty(
		Iterator.prototype,
		Symbol.iterator,
		d(function () {
			return this;
		})
	);


/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var copy             = __webpack_require__(124)
	  , normalizeOptions = __webpack_require__(104)
	  , ensureCallable   = __webpack_require__(96)
	  , map              = __webpack_require__(129)
	  , callable         = __webpack_require__(96)
	  , validValue       = __webpack_require__(79)

	  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
	  , hasOwnProperty = Object.prototype.hasOwnProperty
	  , define;

	define = function (name, desc, options) {
		var value = validValue(desc) && callable(desc.value), dgs;
		dgs = copy(desc);
		delete dgs.writable;
		delete dgs.value;
		dgs.get = function () {
			if (!options.overwriteDefinition && hasOwnProperty.call(this, name)) return value;
			desc.value = bind.call(value, options.resolveContext ? options.resolveContext(this) : this);
			defineProperty(this, name, desc);
			return this[name];
		};
		return dgs;
	};

	module.exports = function (props/*, options*/) {
		var options = normalizeOptions(arguments[1]);
		if (options.resolveContext != null) ensureCallable(options.resolveContext);
		return map(props, function (desc, name) { return define(name, desc, options); });
	};


/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var aFrom  = __webpack_require__(125)
	  , assign = __webpack_require__(98)
	  , value  = __webpack_require__(79);

	module.exports = function (obj/*, propertyNames, options*/) {
		var copy = Object(value(obj)), propertyNames = arguments[1], options = Object(arguments[2]);
		if (copy !== obj && !propertyNames) return copy;
		var result = {};
		if (propertyNames) {
			aFrom(propertyNames, function (propertyName) {
				if (options.ensure || propertyName in obj) result[propertyName] = obj[propertyName];
			});
		} else {
			assign(result, obj);
		}
		return result;
	};


/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(126)()
		? Array.from
		: __webpack_require__(127);


/***/ }),
/* 126 */
/***/ (function(module, exports) {

	"use strict";

	module.exports = function () {
		var from = Array.from, arr, result;
		if (typeof from !== "function") return false;
		arr = ["raz", "dwa"];
		result = from(arr);
		return Boolean(result && (result !== arr) && (result[1] === "dwa"));
	};


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var iteratorSymbol = __webpack_require__(110).iterator
	  , isArguments    = __webpack_require__(117)
	  , isFunction     = __webpack_require__(128)
	  , toPosInt       = __webpack_require__(86)
	  , callable       = __webpack_require__(96)
	  , validValue     = __webpack_require__(79)
	  , isValue        = __webpack_require__(80)
	  , isString       = __webpack_require__(118)
	  , isArray        = Array.isArray
	  , call           = Function.prototype.call
	  , desc           = { configurable: true, enumerable: true, writable: true, value: null }
	  , defineProperty = Object.defineProperty;

	// eslint-disable-next-line complexity
	module.exports = function (arrayLike /*, mapFn, thisArg*/) {
		var mapFn = arguments[1]
		  , thisArg = arguments[2]
		  , Context
		  , i
		  , j
		  , arr
		  , length
		  , code
		  , iterator
		  , result
		  , getIterator
		  , value;

		arrayLike = Object(validValue(arrayLike));

		if (isValue(mapFn)) callable(mapFn);
		if (!this || this === Array || !isFunction(this)) {
			// Result: Plain array
			if (!mapFn) {
				if (isArguments(arrayLike)) {
					// Source: Arguments
					length = arrayLike.length;
					if (length !== 1) return Array.apply(null, arrayLike);
					arr = new Array(1);
					arr[0] = arrayLike[0];
					return arr;
				}
				if (isArray(arrayLike)) {
					// Source: Array
					arr = new Array(length = arrayLike.length);
					for (i = 0; i < length; ++i) arr[i] = arrayLike[i];
					return arr;
				}
			}
			arr = [];
		} else {
			// Result: Non plain array
			Context = this;
		}

		if (!isArray(arrayLike)) {
			if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
				// Source: Iterator
				iterator = callable(getIterator).call(arrayLike);
				if (Context) arr = new Context();
				result = iterator.next();
				i = 0;
				while (!result.done) {
					value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
					if (Context) {
						desc.value = value;
						defineProperty(arr, i, desc);
					} else {
						arr[i] = value;
					}
					result = iterator.next();
					++i;
				}
				length = i;
			} else if (isString(arrayLike)) {
				// Source: String
				length = arrayLike.length;
				if (Context) arr = new Context();
				for (i = 0, j = 0; i < length; ++i) {
					value = arrayLike[i];
					if (i + 1 < length) {
						code = value.charCodeAt(0);
						// eslint-disable-next-line max-depth
						if (code >= 0xd800 && code <= 0xdbff) value += arrayLike[++i];
					}
					value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
					if (Context) {
						desc.value = value;
						defineProperty(arr, j, desc);
					} else {
						arr[j] = value;
					}
					++j;
				}
				length = j;
			}
		}
		if (length === undefined) {
			// Source: array or array-like
			length = toPosInt(arrayLike.length);
			if (Context) arr = new Context(length);
			for (i = 0; i < length; ++i) {
				value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
				if (Context) {
					desc.value = value;
					defineProperty(arr, i, desc);
				} else {
					arr[i] = value;
				}
			}
		}
		if (Context) {
			desc.value = null;
			arr.length = length;
		}
		return arr;
	};


/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var objToString = Object.prototype.toString, id = objToString.call(__webpack_require__(81));

	module.exports = function (value) {
		return typeof value === "function" && objToString.call(value) === id;
	};


/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	var callable = __webpack_require__(96)
	  , forEach  = __webpack_require__(130)
	  , call     = Function.prototype.call;

	module.exports = function (obj, cb /*, thisArg*/) {
		var result = {}, thisArg = arguments[2];
		callable(cb);
		forEach(obj, function (value, key, targetObj, index) {
			result[key] = call.call(cb, thisArg, value, key, targetObj, index);
		});
		return result;
	};


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = __webpack_require__(131)("forEach");


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

	// Internal method, used by iteration functions.
	// Calls a function for each key-value pair found in object
	// Optionally takes compareFn to iterate object in specific order

	"use strict";

	var callable                = __webpack_require__(96)
	  , value                   = __webpack_require__(79)
	  , bind                    = Function.prototype.bind
	  , call                    = Function.prototype.call
	  , keys                    = Object.keys
	  , objPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;

	module.exports = function (method, defVal) {
		return function (obj, cb /*, thisArg, compareFn*/) {
			var list, thisArg = arguments[2], compareFn = arguments[3];
			obj = Object(value(obj));
			callable(cb);

			list = keys(obj);
			if (compareFn) {
				list.sort(typeof compareFn === "function" ? bind.call(compareFn, obj) : undefined);
			}
			if (typeof method !== "function") method = list[method];
			return call.call(method, list, function (key, index) {
				if (!objPropertyIsEnumerable.call(obj, key)) return defVal;
				return call.call(cb, thisArg, obj[key], key, obj, index);
			});
		};
	};


/***/ }),
/* 132 */
/***/ (function(module, exports, __webpack_require__) {

	// Thanks @mathiasbynens
	// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

	"use strict";

	var setPrototypeOf = __webpack_require__(91)
	  , d              = __webpack_require__(97)
	  , Symbol         = __webpack_require__(110)
	  , Iterator       = __webpack_require__(122);

	var defineProperty = Object.defineProperty, StringIterator;

	StringIterator = module.exports = function (str) {
		if (!(this instanceof StringIterator)) throw new TypeError("Constructor requires 'new'");
		str = String(str);
		Iterator.call(this, str);
		defineProperty(this, "__length__", d("", str.length));
	};
	if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

	// Internal %ArrayIteratorPrototype% doesn't expose its constructor
	delete StringIterator.prototype.constructor;

	StringIterator.prototype = Object.create(Iterator.prototype, {
		_next: d(function () {
			if (!this.__list__) return undefined;
			if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
			this._unBind();
			return undefined;
		}),
		_resolve: d(function (i) {
			var char = this.__list__[i], code;
			if (this.__nextIndex__ === this.__length__) return char;
			code = char.charCodeAt(0);
			if (code >= 0xd800 && code <= 0xdbff) return char + this.__list__[this.__nextIndex__++];
			return char;
		})
	});
	defineProperty(StringIterator.prototype, Symbol.toStringTag, d("c", "String Iterator"));


/***/ }),
/* 133 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var setPrototypeOf    = __webpack_require__(91)
	  , d                 = __webpack_require__(97)
	  , Iterator          = __webpack_require__(122)
	  , toStringTagSymbol = __webpack_require__(110).toStringTag
	  , kinds             = __webpack_require__(134)

	  , defineProperties = Object.defineProperties
	  , unBind = Iterator.prototype._unBind
	  , MapIterator;

	MapIterator = module.exports = function (map, kind) {
		if (!(this instanceof MapIterator)) return new MapIterator(map, kind);
		Iterator.call(this, map.__mapKeysData__, map);
		if (!kind || !kinds[kind]) kind = 'key+value';
		defineProperties(this, {
			__kind__: d('', kind),
			__values__: d('w', map.__mapValuesData__)
		});
	};
	if (setPrototypeOf) setPrototypeOf(MapIterator, Iterator);

	MapIterator.prototype = Object.create(Iterator.prototype, {
		constructor: d(MapIterator),
		_resolve: d(function (i) {
			if (this.__kind__ === 'value') return this.__values__[i];
			if (this.__kind__ === 'key') return this.__list__[i];
			return [this.__list__[i], this.__values__[i]];
		}),
		_unBind: d(function () {
			this.__values__ = null;
			unBind.call(this);
		}),
		toString: d(function () { return '[object Map Iterator]'; })
	});
	Object.defineProperty(MapIterator.prototype, toStringTagSymbol,
		d('c', 'Map Iterator'));


/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(135)('key',
		'value', 'key+value');


/***/ }),
/* 135 */
/***/ (function(module, exports) {

	"use strict";

	var forEach = Array.prototype.forEach, create = Object.create;

	// eslint-disable-next-line no-unused-vars
	module.exports = function (arg /*, ???args*/) {
		var set = create(null);
		forEach.call(arguments, function (name) {
			set[name] = true;
		});
		return set;
	};


/***/ }),
/* 136 */
/***/ (function(module, exports) {

	// Exports true if environment provides native `Map` implementation,
	// whatever that is.

	'use strict';

	module.exports = (function () {
		if (typeof Map === 'undefined') return false;
		return (Object.prototype.toString.call(new Map()) === '[object Map]');
	}());


/***/ }),
/* 137 */
/***/ (function(module, exports, __webpack_require__) {

	var once = __webpack_require__(138);

	var noop = function() {};

	var isRequest = function(stream) {
		return stream.setHeader && typeof stream.abort === 'function';
	};

	var isChildProcess = function(stream) {
		return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
	};

	var eos = function(stream, opts, callback) {
		if (typeof opts === 'function') return eos(stream, null, opts);
		if (!opts) opts = {};

		callback = once(callback || noop);

		var ws = stream._writableState;
		var rs = stream._readableState;
		var readable = opts.readable || (opts.readable !== false && stream.readable);
		var writable = opts.writable || (opts.writable !== false && stream.writable);

		var onlegacyfinish = function() {
			if (!stream.writable) onfinish();
		};

		var onfinish = function() {
			writable = false;
			if (!readable) callback.call(stream);
		};

		var onend = function() {
			readable = false;
			if (!writable) callback.call(stream);
		};

		var onexit = function(exitCode) {
			callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
		};

		var onerror = function(err) {
			callback.call(stream, err);
		};

		var onclose = function() {
			if (readable && !(rs && rs.ended)) return callback.call(stream, new Error('premature close'));
			if (writable && !(ws && ws.ended)) return callback.call(stream, new Error('premature close'));
		};

		var onrequest = function() {
			stream.req.on('finish', onfinish);
		};

		if (isRequest(stream)) {
			stream.on('complete', onfinish);
			stream.on('abort', onclose);
			if (stream.req) onrequest();
			else stream.on('request', onrequest);
		} else if (writable && !ws) { // legacy streams
			stream.on('end', onlegacyfinish);
			stream.on('close', onlegacyfinish);
		}

		if (isChildProcess(stream)) stream.on('exit', onexit);

		stream.on('end', onend);
		stream.on('finish', onfinish);
		if (opts.error !== false) stream.on('error', onerror);
		stream.on('close', onclose);

		return function() {
			stream.removeListener('complete', onfinish);
			stream.removeListener('abort', onclose);
			stream.removeListener('request', onrequest);
			if (stream.req) stream.req.removeListener('finish', onfinish);
			stream.removeListener('end', onlegacyfinish);
			stream.removeListener('close', onlegacyfinish);
			stream.removeListener('finish', onfinish);
			stream.removeListener('exit', onexit);
			stream.removeListener('end', onend);
			stream.removeListener('error', onerror);
			stream.removeListener('close', onclose);
		};
	};

	module.exports = eos;


/***/ }),
/* 138 */
/***/ (function(module, exports, __webpack_require__) {

	var wrappy = __webpack_require__(139)
	module.exports = wrappy(once)
	module.exports.strict = wrappy(onceStrict)

	once.proto = once(function () {
	  Object.defineProperty(Function.prototype, 'once', {
	    value: function () {
	      return once(this)
	    },
	    configurable: true
	  })

	  Object.defineProperty(Function.prototype, 'onceStrict', {
	    value: function () {
	      return onceStrict(this)
	    },
	    configurable: true
	  })
	})

	function once (fn) {
	  var f = function () {
	    if (f.called) return f.value
	    f.called = true
	    return f.value = fn.apply(this, arguments)
	  }
	  f.called = false
	  return f
	}

	function onceStrict (fn) {
	  var f = function () {
	    if (f.called)
	      throw new Error(f.onceError)
	    f.called = true
	    return f.value = fn.apply(this, arguments)
	  }
	  var name = fn.name || 'Function wrapped with `once`'
	  f.onceError = name + " shouldn't be called more than once"
	  f.called = false
	  return f
	}


/***/ }),
/* 139 */
/***/ (function(module, exports) {

	// Returns a wrapper function that returns a wrapped callback
	// The wrapper function should do some stuff, and return a
	// presumably different callback function.
	// This makes sure that own properties are retained, so that
	// decorations and such are not lost along the way.
	module.exports = wrappy
	function wrappy (fn, cb) {
	  if (fn && cb) return wrappy(fn)(cb)

	  if (typeof fn !== 'function')
	    throw new TypeError('need wrapper function')

	  Object.keys(fn).forEach(function (k) {
	    wrapper[k] = fn[k]
	  })

	  return wrapper

	  function wrapper() {
	    var args = new Array(arguments.length)
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i]
	    }
	    var ret = fn.apply(this, args)
	    var cb = args[args.length-1]
	    if (typeof ret === 'function' && ret !== cb) {
	      Object.keys(cb).forEach(function (k) {
	        ret[k] = cb[k]
	      })
	    }
	    return ret
	  }
	}


/***/ }),
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	exports.parser = __webpack_require__(141)
	exports.generate = __webpack_require__(159)
	exports.writeToStream = __webpack_require__(160)


/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	var bl = __webpack_require__(142)
	var inherits = __webpack_require__(2)
	var EE = __webpack_require__(3).EventEmitter
	var Packet = __webpack_require__(157)
	var constants = __webpack_require__(158)

	function Parser () {
	  if (!(this instanceof Parser)) return new Parser()

	  this._states = [
	    '_parseHeader',
	    '_parseLength',
	    '_parsePayload',
	    '_newPacket'
	  ]

	  this._resetState()
	}

	inherits(Parser, EE)

	Parser.prototype._resetState = function () {
	  this.packet = new Packet()
	  this.error = null
	  this._list = bl()
	  this._stateCounter = 0
	}

	Parser.prototype.parse = function (buf) {
	  if (this.error) this._resetState()

	  this._list.append(buf)

	  while ((this.packet.length !== -1 || this._list.length > 0) &&
	         this[this._states[this._stateCounter]]() &&
	         !this.error) {
	    this._stateCounter++

	    if (this._stateCounter >= this._states.length) this._stateCounter = 0
	  }

	  return this._list.length
	}

	Parser.prototype._parseHeader = function () {
	  // There is at least one byte in the buffer
	  var zero = this._list.readUInt8(0)
	  this.packet.cmd = constants.types[zero >> constants.CMD_SHIFT]
	  this.packet.retain = (zero & constants.RETAIN_MASK) !== 0
	  this.packet.qos = (zero >> constants.QOS_SHIFT) & constants.QOS_MASK
	  this.packet.dup = (zero & constants.DUP_MASK) !== 0

	  this._list.consume(1)

	  return true
	}

	Parser.prototype._parseLength = function () {
	  // There is at least one byte in the list
	  var bytes = 0
	  var mul = 1
	  var length = 0
	  var result = true
	  var current

	  while (bytes < 5) {
	    current = this._list.readUInt8(bytes++)
	    length += mul * (current & constants.LENGTH_MASK)
	    mul *= 0x80

	    if ((current & constants.LENGTH_FIN_MASK) === 0) break
	    if (this._list.length <= bytes) {
	      result = false
	      break
	    }
	  }

	  if (result) {
	    this.packet.length = length
	    this._list.consume(bytes)
	  }

	  return result
	}

	Parser.prototype._parsePayload = function () {
	  var result = false

	  // Do we have a payload? Do we have enough data to complete the payload?
	  // PINGs have no payload
	  if (this.packet.length === 0 || this._list.length >= this.packet.length) {
	    this._pos = 0

	    switch (this.packet.cmd) {
	      case 'connect':
	        this._parseConnect()
	        break
	      case 'connack':
	        this._parseConnack()
	        break
	      case 'publish':
	        this._parsePublish()
	        break
	      case 'puback':
	      case 'pubrec':
	      case 'pubrel':
	      case 'pubcomp':
	        this._parseMessageId()
	        break
	      case 'subscribe':
	        this._parseSubscribe()
	        break
	      case 'suback':
	        this._parseSuback()
	        break
	      case 'unsubscribe':
	        this._parseUnsubscribe()
	        break
	      case 'unsuback':
	        this._parseUnsuback()
	        break
	      case 'pingreq':
	      case 'pingresp':
	      case 'disconnect':
	        // These are empty, nothing to do
	        break
	      default:
	        this._emitError(new Error('Not supported'))
	    }

	    result = true
	  }

	  return result
	}

	Parser.prototype._parseConnect = function () {
	  var protocolId // Protocol ID
	  var clientId // Client ID
	  var topic // Will topic
	  var payload // Will payload
	  var password // Password
	  var username // Username
	  var flags = {}
	  var packet = this.packet

	  // Parse protocolId
	  protocolId = this._parseString()

	  if (protocolId === null) return this._emitError(new Error('Cannot parse protocolId'))
	  if (protocolId !== 'MQTT' && protocolId !== 'MQIsdp') {
	    return this._emitError(new Error('Invalid protocolId'))
	  }

	  packet.protocolId = protocolId

	  // Parse constants version number
	  if (this._pos >= this._list.length) return this._emitError(new Error('Packet too short'))

	  packet.protocolVersion = this._list.readUInt8(this._pos)

	  if (packet.protocolVersion !== 3 && packet.protocolVersion !== 4) {
	    return this._emitError(new Error('Invalid protocol version'))
	  }

	  this._pos++

	  if (this._pos >= this._list.length) {
	    return this._emitError(new Error('Packet too short'))
	  }

	  // Parse connect flags
	  flags.username = (this._list.readUInt8(this._pos) & constants.USERNAME_MASK)
	  flags.password = (this._list.readUInt8(this._pos) & constants.PASSWORD_MASK)
	  flags.will = (this._list.readUInt8(this._pos) & constants.WILL_FLAG_MASK)

	  if (flags.will) {
	    packet.will = {}
	    packet.will.retain = (this._list.readUInt8(this._pos) & constants.WILL_RETAIN_MASK) !== 0
	    packet.will.qos = (this._list.readUInt8(this._pos) &
	                          constants.WILL_QOS_MASK) >> constants.WILL_QOS_SHIFT
	  }

	  packet.clean = (this._list.readUInt8(this._pos) & constants.CLEAN_SESSION_MASK) !== 0
	  this._pos++

	  // Parse keepalive
	  packet.keepalive = this._parseNum()
	  if (packet.keepalive === -1) return this._emitError(new Error('Packet too short'))

	  // Parse clientId
	  clientId = this._parseString()
	  if (clientId === null) return this._emitError(new Error('Packet too short'))
	  packet.clientId = clientId

	  if (flags.will) {
	    // Parse will topic
	    topic = this._parseString()
	    if (topic === null) return this._emitError(new Error('Cannot parse will topic'))
	    packet.will.topic = topic

	    // Parse will payload
	    payload = this._parseBuffer()
	    if (payload === null) return this._emitError(new Error('Cannot parse will payload'))
	    packet.will.payload = payload
	  }

	  // Parse username
	  if (flags.username) {
	    username = this._parseString()
	    if (username === null) return this._emitError(new Error('Cannot parse username'))
	    packet.username = username
	  }

	  // Parse password
	  if (flags.password) {
	    password = this._parseBuffer()
	    if (password === null) return this._emitError(new Error('Cannot parse password'))
	    packet.password = password
	  }

	  return packet
	}

	Parser.prototype._parseConnack = function () {
	  var packet = this.packet

	  if (this._list.length < 2) return null

	  packet.sessionPresent = !!(this._list.readUInt8(this._pos++) & constants.SESSIONPRESENT_MASK)
	  packet.returnCode = this._list.readUInt8(this._pos)

	  if (packet.returnCode === -1) return this._emitError(new Error('Cannot parse return code'))
	}

	Parser.prototype._parsePublish = function () {
	  var packet = this.packet
	  packet.topic = this._parseString()

	  if (packet.topic === null) return this._emitError(new Error('Cannot parse topic'))

	  // Parse messageId
	  if (packet.qos > 0) if (!this._parseMessageId()) { return }

	  packet.payload = this._list.slice(this._pos, packet.length)
	}

	Parser.prototype._parseSubscribe = function () {
	  var packet = this.packet
	  var topic
	  var qos

	  if (packet.qos !== 1) {
	    return this._emitError(new Error('Wrong subscribe header'))
	  }

	  packet.subscriptions = []

	  if (!this._parseMessageId()) { return }

	  while (this._pos < packet.length) {
	    // Parse topic
	    topic = this._parseString()
	    if (topic === null) return this._emitError(new Error('Cannot parse topic'))

	    qos = this._list.readUInt8(this._pos++)

	    // Push pair to subscriptions
	    packet.subscriptions.push({ topic: topic, qos: qos })
	  }
	}

	Parser.prototype._parseSuback = function () {
	  this.packet.granted = []

	  if (!this._parseMessageId()) { return }

	  // Parse granted QoSes
	  while (this._pos < this.packet.length) {
	    this.packet.granted.push(this._list.readUInt8(this._pos++))
	  }
	}

	Parser.prototype._parseUnsubscribe = function () {
	  var packet = this.packet

	  packet.unsubscriptions = []

	  // Parse messageId
	  if (!this._parseMessageId()) { return }

	  while (this._pos < packet.length) {
	    var topic

	    // Parse topic
	    topic = this._parseString()
	    if (topic === null) return this._emitError(new Error('Cannot parse topic'))

	    // Push topic to unsubscriptions
	    packet.unsubscriptions.push(topic)
	  }
	}

	Parser.prototype._parseUnsuback = function () {
	  if (!this._parseMessageId()) return this._emitError(new Error('Cannot parse messageId'))
	}

	Parser.prototype._parseMessageId = function () {
	  var packet = this.packet

	  packet.messageId = this._parseNum()

	  if (packet.messageId === null) {
	    this._emitError(new Error('Cannot parse messageId'))
	    return false
	  }

	  return true
	}

	Parser.prototype._parseString = function (maybeBuffer) {
	  var length = this._parseNum()
	  var result
	  var end = length + this._pos

	  if (length === -1 || end > this._list.length || end > this.packet.length) return null

	  result = this._list.toString('utf8', this._pos, end)
	  this._pos += length

	  return result
	}

	Parser.prototype._parseBuffer = function () {
	  var length = this._parseNum()
	  var result
	  var end = length + this._pos

	  if (length === -1 || end > this._list.length || end > this.packet.length) return null

	  result = this._list.slice(this._pos, end)

	  this._pos += length

	  return result
	}

	Parser.prototype._parseNum = function () {
	  if (this._list.length - this._pos < 2) return -1

	  var result = this._list.readUInt16BE(this._pos)
	  this._pos += 2

	  return result
	}

	Parser.prototype._newPacket = function () {
	  if (this.packet) {
	    this._list.consume(this.packet.length)
	    this.emit('packet', this.packet)
	  }

	  this.packet = new Packet()

	  return true
	}

	Parser.prototype._emitError = function (err) {
	  this.error = err
	  this.emit('error', err)
	}

	module.exports = Parser


/***/ }),
/* 142 */
/***/ (function(module, exports, __webpack_require__) {

	var DuplexStream = __webpack_require__(143)
	  , util         = __webpack_require__(154)
	  , Buffer       = __webpack_require__(57).Buffer


	function BufferList (callback) {
	  if (!(this instanceof BufferList))
	    return new BufferList(callback)

	  this._bufs  = []
	  this.length = 0

	  if (typeof callback == 'function') {
	    this._callback = callback

	    var piper = function piper (err) {
	      if (this._callback) {
	        this._callback(err)
	        this._callback = null
	      }
	    }.bind(this)

	    this.on('pipe', function onPipe (src) {
	      src.on('error', piper)
	    })
	    this.on('unpipe', function onUnpipe (src) {
	      src.removeListener('error', piper)
	    })
	  } else {
	    this.append(callback)
	  }

	  DuplexStream.call(this)
	}


	util.inherits(BufferList, DuplexStream)


	BufferList.prototype._offset = function _offset (offset) {
	  var tot = 0, i = 0, _t
	  if (offset === 0) return [ 0, 0 ]
	  for (; i < this._bufs.length; i++) {
	    _t = tot + this._bufs[i].length
	    if (offset < _t || i == this._bufs.length - 1)
	      return [ i, offset - tot ]
	    tot = _t
	  }
	}


	BufferList.prototype.append = function append (buf) {
	  var i = 0

	  if (Buffer.isBuffer(buf)) {
	    this._appendBuffer(buf);
	  } else if (Array.isArray(buf)) {
	    for (; i < buf.length; i++)
	      this.append(buf[i])
	  } else if (buf instanceof BufferList) {
	    // unwrap argument into individual BufferLists
	    for (; i < buf._bufs.length; i++)
	      this.append(buf._bufs[i])
	  } else if (buf != null) {
	    // coerce number arguments to strings, since Buffer(number) does
	    // uninitialized memory allocation
	    if (typeof buf == 'number')
	      buf = buf.toString()

	    this._appendBuffer(Buffer.from(buf));
	  }

	  return this
	}


	BufferList.prototype._appendBuffer = function appendBuffer (buf) {
	  this._bufs.push(buf)
	  this.length += buf.length
	}


	BufferList.prototype._write = function _write (buf, encoding, callback) {
	  this._appendBuffer(buf)

	  if (typeof callback == 'function')
	    callback()
	}


	BufferList.prototype._read = function _read (size) {
	  if (!this.length)
	    return this.push(null)

	  size = Math.min(size, this.length)
	  this.push(this.slice(0, size))
	  this.consume(size)
	}


	BufferList.prototype.end = function end (chunk) {
	  DuplexStream.prototype.end.call(this, chunk)

	  if (this._callback) {
	    this._callback(null, this.slice())
	    this._callback = null
	  }
	}


	BufferList.prototype.get = function get (index) {
	  return this.slice(index, index + 1)[0]
	}


	BufferList.prototype.slice = function slice (start, end) {
	  if (typeof start == 'number' && start < 0)
	    start += this.length
	  if (typeof end == 'number' && end < 0)
	    end += this.length
	  return this.copy(null, 0, start, end)
	}


	BufferList.prototype.copy = function copy (dst, dstStart, srcStart, srcEnd) {
	  if (typeof srcStart != 'number' || srcStart < 0)
	    srcStart = 0
	  if (typeof srcEnd != 'number' || srcEnd > this.length)
	    srcEnd = this.length
	  if (srcStart >= this.length)
	    return dst || Buffer.alloc(0)
	  if (srcEnd <= 0)
	    return dst || Buffer.alloc(0)

	  var copy   = !!dst
	    , off    = this._offset(srcStart)
	    , len    = srcEnd - srcStart
	    , bytes  = len
	    , bufoff = (copy && dstStart) || 0
	    , start  = off[1]
	    , l
	    , i

	  // copy/slice everything
	  if (srcStart === 0 && srcEnd == this.length) {
	    if (!copy) { // slice, but full concat if multiple buffers
	      return this._bufs.length === 1
	        ? this._bufs[0]
	        : Buffer.concat(this._bufs, this.length)
	    }

	    // copy, need to copy individual buffers
	    for (i = 0; i < this._bufs.length; i++) {
	      this._bufs[i].copy(dst, bufoff)
	      bufoff += this._bufs[i].length
	    }

	    return dst
	  }

	  // easy, cheap case where it's a subset of one of the buffers
	  if (bytes <= this._bufs[off[0]].length - start) {
	    return copy
	      ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes)
	      : this._bufs[off[0]].slice(start, start + bytes)
	  }

	  if (!copy) // a slice, we need something to copy in to
	    dst = Buffer.allocUnsafe(len)

	  for (i = off[0]; i < this._bufs.length; i++) {
	    l = this._bufs[i].length - start

	    if (bytes > l) {
	      this._bufs[i].copy(dst, bufoff, start)
	    } else {
	      this._bufs[i].copy(dst, bufoff, start, start + bytes)
	      break
	    }

	    bufoff += l
	    bytes -= l

	    if (start)
	      start = 0
	  }

	  return dst
	}

	BufferList.prototype.shallowSlice = function shallowSlice (start, end) {
	  start = start || 0
	  end = end || this.length

	  if (start < 0)
	    start += this.length
	  if (end < 0)
	    end += this.length

	  var startOffset = this._offset(start)
	    , endOffset = this._offset(end)
	    , buffers = this._bufs.slice(startOffset[0], endOffset[0] + 1)

	  if (endOffset[1] == 0)
	    buffers.pop()
	  else
	    buffers[buffers.length-1] = buffers[buffers.length-1].slice(0, endOffset[1])

	  if (startOffset[1] != 0)
	    buffers[0] = buffers[0].slice(startOffset[1])

	  return new BufferList(buffers)
	}

	BufferList.prototype.toString = function toString (encoding, start, end) {
	  return this.slice(start, end).toString(encoding)
	}

	BufferList.prototype.consume = function consume (bytes) {
	  while (this._bufs.length) {
	    if (bytes >= this._bufs[0].length) {
	      bytes -= this._bufs[0].length
	      this.length -= this._bufs[0].length
	      this._bufs.shift()
	    } else {
	      this._bufs[0] = this._bufs[0].slice(bytes)
	      this.length -= bytes
	      break
	    }
	  }
	  return this
	}


	BufferList.prototype.duplicate = function duplicate () {
	  var i = 0
	    , copy = new BufferList()

	  for (; i < this._bufs.length; i++)
	    copy.append(this._bufs[i])

	  return copy
	}


	BufferList.prototype.destroy = function destroy () {
	  this._bufs.length = 0
	  this.length = 0
	  this.push(null)
	}


	;(function () {
	  var methods = {
	      'readDoubleBE' : 8
	    , 'readDoubleLE' : 8
	    , 'readFloatBE'  : 4
	    , 'readFloatLE'  : 4
	    , 'readInt32BE'  : 4
	    , 'readInt32LE'  : 4
	    , 'readUInt32BE' : 4
	    , 'readUInt32LE' : 4
	    , 'readInt16BE'  : 2
	    , 'readInt16LE'  : 2
	    , 'readUInt16BE' : 2
	    , 'readUInt16LE' : 2
	    , 'readInt8'     : 1
	    , 'readUInt8'    : 1
	  }

	  for (var m in methods) {
	    (function (m) {
	      BufferList.prototype[m] = function (offset) {
	        return this.slice(offset, offset + methods[m])[m](0)
	      }
	    }(m))
	  }
	}())


	module.exports = BufferList


/***/ }),
/* 143 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(144);


/***/ }),
/* 144 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(145);
	/*</replacement>*/

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/

	module.exports = Duplex;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	var Readable = __webpack_require__(146);
	var Writable = __webpack_require__(153);

	util.inherits(Duplex, Readable);

	{
	  // avoid scope creep, the keys array can then be collected
	  var keys = objectKeys(Writable.prototype);
	  for (var v = 0; v < keys.length; v++) {
	    var method = keys[v];
	    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	  }
	}

	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  pna.nextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	Object.defineProperty(Duplex.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed && this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	    this._writableState.destroyed = value;
	  }
	});

	Duplex.prototype._destroy = function (err, cb) {
	  this.push(null);
	  this.end();

	  pna.nextTick(cb, err);
	};

/***/ }),
/* 145 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = { nextTick: nextTick };
	} else {
	  module.exports = process
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 146 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(145);
	/*</replacement>*/

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(55);
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	/*<replacement>*/
	var EE = __webpack_require__(3).EventEmitter;

	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(147);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var debugUtil = __webpack_require__(148);
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/

	var BufferList = __webpack_require__(149);
	var destroyImpl = __webpack_require__(151);
	var StringDecoder;

	util.inherits(Readable, Stream);

	var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

	  // This is a hack to make sure that our error handler is attached before any
	  // userland ones.  NEVER DO THIS. This is here only because this code needs
	  // to continue to work with older versions of Node.js that do not include
	  // the prependListener() method. The goal is to eventually remove this hack.
	  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
	}

	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(144);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var readableHwm = options.readableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the event 'readable'/'data' is emitted
	  // immediately, or on a later tick.  We set this to true at first, because
	  // any actions that shouldn't happen until "later" should generally also
	  // not happen before the first read call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(152).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(144);

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options) {
	    if (typeof options.read === 'function') this._read = options.read;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
	  }

	  Stream.call(this);
	}

	Object.defineProperty(Readable.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._readableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	  }
	});

	Readable.prototype.destroy = destroyImpl.destroy;
	Readable.prototype._undestroy = destroyImpl.undestroy;
	Readable.prototype._destroy = function (err, cb) {
	  this.push(null);
	  cb(err);
	};

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;
	  var skipChunkCheck;

	  if (!state.objectMode) {
	    if (typeof chunk === 'string') {
	      encoding = encoding || state.defaultEncoding;
	      if (encoding !== state.encoding) {
	        chunk = Buffer.from(chunk, encoding);
	        encoding = '';
	      }
	      skipChunkCheck = true;
	    }
	  } else {
	    skipChunkCheck = true;
	  }

	  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  return readableAddChunk(this, chunk, null, true, false);
	};

	function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
	  var state = stream._readableState;
	  if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else {
	    var er;
	    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
	    if (er) {
	      stream.emit('error', er);
	    } else if (state.objectMode || chunk && chunk.length > 0) {
	      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
	        chunk = _uint8ArrayToBuffer(chunk);
	      }

	      if (addToFront) {
	        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
	      } else if (state.ended) {
	        stream.emit('error', new Error('stream.push() after EOF'));
	      } else {
	        state.reading = false;
	        if (state.decoder && !encoding) {
	          chunk = state.decoder.write(chunk);
	          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
	        } else {
	          addChunk(stream, state, chunk, false);
	        }
	      }
	    } else if (!addToFront) {
	      state.reading = false;
	    }
	  }

	  return needMoreData(state);
	}

	function addChunk(stream, state, chunk, addToFront) {
	  if (state.flowing && state.length === 0 && !state.sync) {
	    stream.emit('data', chunk);
	    stream.read(0);
	  } else {
	    // update the buffer info.
	    state.length += state.objectMode ? 1 : chunk.length;
	    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	    if (state.needReadable) emitReadable(stream);
	  }
	  maybeReadMore(stream, state);
	}

	function chunkInvalid(state, chunk) {
	  var er;
	  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(152).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;

	  if (n !== 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }

	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    pna.nextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('_read() is not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

	  var endFn = doEnd ? onend : unpipe;
	  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable, unpipeInfo) {
	    debug('onunpipe');
	    if (readable === src) {
	      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
	        unpipeInfo.hasUnpiped = true;
	        cleanup();
	      }
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', unpipe);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }

	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;
	  var unpipeInfo = { hasUnpiped: false };

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this, unpipeInfo);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++) {
	      dests[i].emit('unpipe', this, unpipeInfo);
	    }return this;
	  }

	  // try to find the right one.
	  var index = indexOf(state.pipes, dest);
	  if (index === -1) return this;

	  state.pipes.splice(index, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this, unpipeInfo);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        pna.nextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    pna.nextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var _this = this;

	  var state = this._readableState;
	  var paused = false;

	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) _this.push(chunk);
	    }

	    _this.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = _this.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  for (var n = 0; n < kProxyEvents.length; n++) {
	    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
	  }

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  this._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return this;
	};

	Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._readableState.highWaterMark;
	  }
	});

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;

	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }

	  return ret;
	}

	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}

	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = Buffer.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    pna.nextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 147 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(3).EventEmitter;


/***/ }),
/* 148 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 149 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Buffer = __webpack_require__(57).Buffer;
	var util = __webpack_require__(150);

	function copyBuffer(src, target, offset) {
	  src.copy(target, offset);
	}

	module.exports = function () {
	  function BufferList() {
	    _classCallCheck(this, BufferList);

	    this.head = null;
	    this.tail = null;
	    this.length = 0;
	  }

	  BufferList.prototype.push = function push(v) {
	    var entry = { data: v, next: null };
	    if (this.length > 0) this.tail.next = entry;else this.head = entry;
	    this.tail = entry;
	    ++this.length;
	  };

	  BufferList.prototype.unshift = function unshift(v) {
	    var entry = { data: v, next: this.head };
	    if (this.length === 0) this.tail = entry;
	    this.head = entry;
	    ++this.length;
	  };

	  BufferList.prototype.shift = function shift() {
	    if (this.length === 0) return;
	    var ret = this.head.data;
	    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	    --this.length;
	    return ret;
	  };

	  BufferList.prototype.clear = function clear() {
	    this.head = this.tail = null;
	    this.length = 0;
	  };

	  BufferList.prototype.join = function join(s) {
	    if (this.length === 0) return '';
	    var p = this.head;
	    var ret = '' + p.data;
	    while (p = p.next) {
	      ret += s + p.data;
	    }return ret;
	  };

	  BufferList.prototype.concat = function concat(n) {
	    if (this.length === 0) return Buffer.alloc(0);
	    if (this.length === 1) return this.head.data;
	    var ret = Buffer.allocUnsafe(n >>> 0);
	    var p = this.head;
	    var i = 0;
	    while (p) {
	      copyBuffer(p.data, ret, i);
	      i += p.data.length;
	      p = p.next;
	    }
	    return ret;
	  };

	  return BufferList;
	}();

	if (util && util.inspect && util.inspect.custom) {
	  module.exports.prototype[util.inspect.custom] = function () {
	    var obj = util.inspect({ length: this.length });
	    return this.constructor.name + ' ' + obj;
	  };
	}

/***/ }),
/* 150 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 151 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(145);
	/*</replacement>*/

	// undocumented cb() API, needed for core, not for public API
	function destroy(err, cb) {
	  var _this = this;

	  var readableDestroyed = this._readableState && this._readableState.destroyed;
	  var writableDestroyed = this._writableState && this._writableState.destroyed;

	  if (readableDestroyed || writableDestroyed) {
	    if (cb) {
	      cb(err);
	    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
	      pna.nextTick(emitErrorNT, this, err);
	    }
	    return this;
	  }

	  // we set destroyed to true before firing error callbacks in order
	  // to make it re-entrance safe in case destroy() is called within callbacks

	  if (this._readableState) {
	    this._readableState.destroyed = true;
	  }

	  // if this is a duplex stream mark the writable part as destroyed as well
	  if (this._writableState) {
	    this._writableState.destroyed = true;
	  }

	  this._destroy(err || null, function (err) {
	    if (!cb && err) {
	      pna.nextTick(emitErrorNT, _this, err);
	      if (_this._writableState) {
	        _this._writableState.errorEmitted = true;
	      }
	    } else if (cb) {
	      cb(err);
	    }
	  });

	  return this;
	}

	function undestroy() {
	  if (this._readableState) {
	    this._readableState.destroyed = false;
	    this._readableState.reading = false;
	    this._readableState.ended = false;
	    this._readableState.endEmitted = false;
	  }

	  if (this._writableState) {
	    this._writableState.destroyed = false;
	    this._writableState.ended = false;
	    this._writableState.ending = false;
	    this._writableState.finished = false;
	    this._writableState.errorEmitted = false;
	  }
	}

	function emitErrorNT(self, err) {
	  self.emit('error', err);
	}

	module.exports = {
	  destroy: destroy,
	  undestroy: undestroy
	};

/***/ }),
/* 152 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	/*</replacement>*/

	var isEncoding = Buffer.isEncoding || function (encoding) {
	  encoding = '' + encoding;
	  switch (encoding && encoding.toLowerCase()) {
	    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
	      return true;
	    default:
	      return false;
	  }
	};

	function _normalizeEncoding(enc) {
	  if (!enc) return 'utf8';
	  var retried;
	  while (true) {
	    switch (enc) {
	      case 'utf8':
	      case 'utf-8':
	        return 'utf8';
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return 'utf16le';
	      case 'latin1':
	      case 'binary':
	        return 'latin1';
	      case 'base64':
	      case 'ascii':
	      case 'hex':
	        return enc;
	      default:
	        if (retried) return; // undefined
	        enc = ('' + enc).toLowerCase();
	        retried = true;
	    }
	  }
	};

	// Do not cache `Buffer.isEncoding` when checking encoding names as some
	// modules monkey-patch it to support additional encodings
	function normalizeEncoding(enc) {
	  var nenc = _normalizeEncoding(enc);
	  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
	  return nenc || enc;
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters.
	exports.StringDecoder = StringDecoder;
	function StringDecoder(encoding) {
	  this.encoding = normalizeEncoding(encoding);
	  var nb;
	  switch (this.encoding) {
	    case 'utf16le':
	      this.text = utf16Text;
	      this.end = utf16End;
	      nb = 4;
	      break;
	    case 'utf8':
	      this.fillLast = utf8FillLast;
	      nb = 4;
	      break;
	    case 'base64':
	      this.text = base64Text;
	      this.end = base64End;
	      nb = 3;
	      break;
	    default:
	      this.write = simpleWrite;
	      this.end = simpleEnd;
	      return;
	  }
	  this.lastNeed = 0;
	  this.lastTotal = 0;
	  this.lastChar = Buffer.allocUnsafe(nb);
	}

	StringDecoder.prototype.write = function (buf) {
	  if (buf.length === 0) return '';
	  var r;
	  var i;
	  if (this.lastNeed) {
	    r = this.fillLast(buf);
	    if (r === undefined) return '';
	    i = this.lastNeed;
	    this.lastNeed = 0;
	  } else {
	    i = 0;
	  }
	  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
	  return r || '';
	};

	StringDecoder.prototype.end = utf8End;

	// Returns only complete characters in a Buffer
	StringDecoder.prototype.text = utf8Text;

	// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
	StringDecoder.prototype.fillLast = function (buf) {
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
	  this.lastNeed -= buf.length;
	};

	// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
	// continuation byte. If an invalid byte is detected, -2 is returned.
	function utf8CheckByte(byte) {
	  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
	  return byte >> 6 === 0x02 ? -1 : -2;
	}

	// Checks at most 3 bytes at the end of a Buffer in order to detect an
	// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
	// needed to complete the UTF-8 character (if applicable) are returned.
	function utf8CheckIncomplete(self, buf, i) {
	  var j = buf.length - 1;
	  if (j < i) return 0;
	  var nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 1;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 2;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) {
	      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
	    }
	    return nb;
	  }
	  return 0;
	}

	// Validates as many continuation bytes for a multi-byte UTF-8 character as
	// needed or are available. If we see a non-continuation byte where we expect
	// one, we "replace" the validated continuation bytes we've seen so far with
	// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
	// behavior. The continuation byte check is included three times in the case
	// where all of the continuation bytes for a character exist in the same buffer.
	// It is also done this way as a slight performance increase instead of using a
	// loop.
	function utf8CheckExtraBytes(self, buf, p) {
	  if ((buf[0] & 0xC0) !== 0x80) {
	    self.lastNeed = 0;
	    return '\ufffd';
	  }
	  if (self.lastNeed > 1 && buf.length > 1) {
	    if ((buf[1] & 0xC0) !== 0x80) {
	      self.lastNeed = 1;
	      return '\ufffd';
	    }
	    if (self.lastNeed > 2 && buf.length > 2) {
	      if ((buf[2] & 0xC0) !== 0x80) {
	        self.lastNeed = 2;
	        return '\ufffd';
	      }
	    }
	  }
	}

	// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
	function utf8FillLast(buf) {
	  var p = this.lastTotal - this.lastNeed;
	  var r = utf8CheckExtraBytes(this, buf, p);
	  if (r !== undefined) return r;
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, p, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, p, 0, buf.length);
	  this.lastNeed -= buf.length;
	}

	// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
	// partial character, the character's bytes are buffered until the required
	// number of bytes are available.
	function utf8Text(buf, i) {
	  var total = utf8CheckIncomplete(this, buf, i);
	  if (!this.lastNeed) return buf.toString('utf8', i);
	  this.lastTotal = total;
	  var end = buf.length - (total - this.lastNeed);
	  buf.copy(this.lastChar, 0, end);
	  return buf.toString('utf8', i, end);
	}

	// For UTF-8, a replacement character is added when ending on a partial
	// character.
	function utf8End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + '\ufffd';
	  return r;
	}

	// UTF-16LE typically needs two bytes per character, but even if we have an even
	// number of bytes available, we need to check if we end on a leading/high
	// surrogate. In that case, we need to wait for the next two bytes in order to
	// decode the last character properly.
	function utf16Text(buf, i) {
	  if ((buf.length - i) % 2 === 0) {
	    var r = buf.toString('utf16le', i);
	    if (r) {
	      var c = r.charCodeAt(r.length - 1);
	      if (c >= 0xD800 && c <= 0xDBFF) {
	        this.lastNeed = 2;
	        this.lastTotal = 4;
	        this.lastChar[0] = buf[buf.length - 2];
	        this.lastChar[1] = buf[buf.length - 1];
	        return r.slice(0, -1);
	      }
	    }
	    return r;
	  }
	  this.lastNeed = 1;
	  this.lastTotal = 2;
	  this.lastChar[0] = buf[buf.length - 1];
	  return buf.toString('utf16le', i, buf.length - 1);
	}

	// For UTF-16LE we do not explicitly append special replacement characters if we
	// end on a partial character, we simply let v8 handle that.
	function utf16End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) {
	    var end = this.lastTotal - this.lastNeed;
	    return r + this.lastChar.toString('utf16le', 0, end);
	  }
	  return r;
	}

	function base64Text(buf, i) {
	  var n = (buf.length - i) % 3;
	  if (n === 0) return buf.toString('base64', i);
	  this.lastNeed = 3 - n;
	  this.lastTotal = 3;
	  if (n === 1) {
	    this.lastChar[0] = buf[buf.length - 1];
	  } else {
	    this.lastChar[0] = buf[buf.length - 2];
	    this.lastChar[1] = buf[buf.length - 1];
	  }
	  return buf.toString('base64', i, buf.length - n);
	}

	function base64End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
	  return r;
	}

	// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
	function simpleWrite(buf) {
	  return buf.toString(this.encoding);
	}

	function simpleEnd(buf) {
	  return buf && buf.length ? this.write(buf) : '';
	}

/***/ }),
/* 153 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(145);
	/*</replacement>*/

	module.exports = Writable;

	/* <replacement> */
	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;
	  this.finish = function () {
	    onCorkedFinish(_this, state);
	  };
	}
	/* </replacement> */

	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Writable.WritableState = WritableState;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(71)
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(147);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	var destroyImpl = __webpack_require__(151);

	util.inherits(Writable, Stream);

	function nop() {}

	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(144);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var writableHwm = options.writableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // if _final has been called
	  this.finalCalled = false;

	  // drain event flag.
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function getBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};

	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
	    });
	  } catch (_) {}
	})();

	// Test _writableState for inheritance to account for Duplex streams,
	// whose prototype chain only points to Readable.
	var realHasInstance;
	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
	  realHasInstance = Function.prototype[Symbol.hasInstance];
	  Object.defineProperty(Writable, Symbol.hasInstance, {
	    value: function (object) {
	      if (realHasInstance.call(this, object)) return true;
	      if (this !== Writable) return false;

	      return object && object._writableState instanceof WritableState;
	    }
	  });
	} else {
	  realHasInstance = function (object) {
	    return object instanceof this;
	  };
	}

	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(144);

	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.

	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.
	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
	    return new Writable(options);
	  }

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;

	    if (typeof options.final === 'function') this._final = options.final;
	  }

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  pna.nextTick(cb, er);
	}

	// Checks that a user-supplied chunk is valid, especially for the particular
	// mode the stream is in. Currently this means that `null` is never accepted
	// and undefined/non-string values are only allowed in object mode.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;

	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    pna.nextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	  var isBuf = !state.objectMode && _isUint8Array(chunk);

	  if (isBuf && !Buffer.isBuffer(chunk)) {
	    chunk = _uint8ArrayToBuffer(chunk);
	  }

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = Buffer.from(chunk, encoding);
	  }
	  return chunk;
	}

	Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
	  if (!isBuf) {
	    var newChunk = decodeChunk(state, chunk, encoding);
	    if (chunk !== newChunk) {
	      isBuf = true;
	      encoding = 'buffer';
	      chunk = newChunk;
	    }
	  }
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = {
	      chunk: chunk,
	      encoding: encoding,
	      isBuf: isBuf,
	      callback: cb,
	      next: null
	    };
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;

	  if (sync) {
	    // defer the callback if we are being called synchronously
	    // to avoid piling up things on the stack
	    pna.nextTick(cb, er);
	    // this can emit finish, and it will always happen
	    // after error
	    pna.nextTick(finishMaybe, stream, state);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	  } else {
	    // the caller expect this to happen before if
	    // it is async
	    cb(er);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	    // this can emit finish, but finish must
	    // always follow error
	    finishMaybe(stream, state);
	  }
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    var allBuffers = true;
	    while (entry) {
	      buffer[count] = entry;
	      if (!entry.isBuf) allBuffers = false;
	      entry = entry.next;
	      count += 1;
	    }
	    buffer.allBuffers = allBuffers;

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	    state.bufferedRequestCount = 0;
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      state.bufferedRequestCount--;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('_write() is not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}
	function callFinal(stream, state) {
	  stream._final(function (err) {
	    state.pendingcb--;
	    if (err) {
	      stream.emit('error', err);
	    }
	    state.prefinished = true;
	    stream.emit('prefinish');
	    finishMaybe(stream, state);
	  });
	}
	function prefinish(stream, state) {
	  if (!state.prefinished && !state.finalCalled) {
	    if (typeof stream._final === 'function') {
	      state.pendingcb++;
	      state.finalCalled = true;
	      pna.nextTick(callFinal, stream, state);
	    } else {
	      state.prefinished = true;
	      stream.emit('prefinish');
	    }
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    prefinish(stream, state);
	    if (state.pendingcb === 0) {
	      state.finished = true;
	      stream.emit('finish');
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	function onCorkedFinish(corkReq, state, err) {
	  var entry = corkReq.entry;
	  corkReq.entry = null;
	  while (entry) {
	    var cb = entry.callback;
	    state.pendingcb--;
	    cb(err);
	    entry = entry.next;
	  }
	  if (state.corkedRequestsFree) {
	    state.corkedRequestsFree.next = corkReq;
	  } else {
	    state.corkedRequestsFree = corkReq;
	  }
	}

	Object.defineProperty(Writable.prototype, 'destroyed', {
	  get: function () {
	    if (this._writableState === undefined) {
	      return false;
	    }
	    return this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._writableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._writableState.destroyed = value;
	  }
	});

	Writable.prototype.destroy = destroyImpl.destroy;
	Writable.prototype._undestroy = destroyImpl.undestroy;
	Writable.prototype._destroy = function (err, cb) {
	  this.end();
	  cb(err);
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48), __webpack_require__(68).setImmediate, (function() { return this; }())))

/***/ }),
/* 154 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(155);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(156);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 155 */
/***/ (function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ }),
/* 156 */
/***/ (function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ }),
/* 157 */
/***/ (function(module, exports) {

	
	function Packet () {
	  this.cmd = null
	  this.retain = false
	  this.qos = 0
	  this.dup = false
	  this.length = -1
	  this.topic = null
	  this.payload = null
	}

	module.exports = Packet


/***/ }),
/* 158 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	var Buffer = __webpack_require__(57).Buffer

	/* Protocol - protocol constants */
	var protocol = module.exports

	/* Command code => mnemonic */
	protocol.types = {
	  0: 'reserved',
	  1: 'connect',
	  2: 'connack',
	  3: 'publish',
	  4: 'puback',
	  5: 'pubrec',
	  6: 'pubrel',
	  7: 'pubcomp',
	  8: 'subscribe',
	  9: 'suback',
	  10: 'unsubscribe',
	  11: 'unsuback',
	  12: 'pingreq',
	  13: 'pingresp',
	  14: 'disconnect',
	  15: 'reserved'
	}

	/* Mnemonic => Command code */
	protocol.codes = {}
	for (var k in protocol.types) {
	  var v = protocol.types[k]
	  protocol.codes[v] = k
	}

	/* Header */
	protocol.CMD_SHIFT = 4
	protocol.CMD_MASK = 0xF0
	protocol.DUP_MASK = 0x08
	protocol.QOS_MASK = 0x03
	protocol.QOS_SHIFT = 1
	protocol.RETAIN_MASK = 0x01

	/* Length */
	protocol.LENGTH_MASK = 0x7F
	protocol.LENGTH_FIN_MASK = 0x80

	/* Connack */
	protocol.SESSIONPRESENT_MASK = 0x01
	protocol.SESSIONPRESENT_HEADER = Buffer.from([protocol.SESSIONPRESENT_MASK])
	protocol.CONNACK_HEADER = Buffer.from([protocol.codes['connack'] << protocol.CMD_SHIFT])

	/* Connect */
	protocol.USERNAME_MASK = 0x80
	protocol.PASSWORD_MASK = 0x40
	protocol.WILL_RETAIN_MASK = 0x20
	protocol.WILL_QOS_MASK = 0x18
	protocol.WILL_QOS_SHIFT = 3
	protocol.WILL_FLAG_MASK = 0x04
	protocol.CLEAN_SESSION_MASK = 0x02
	protocol.CONNECT_HEADER = Buffer.from([protocol.codes['connect'] << protocol.CMD_SHIFT])

	function genHeader (type) {
	  return [0, 1, 2].map(function (qos) {
	    return [0, 1].map(function (dup) {
	      return [0, 1].map(function (retain) {
	        var buf = new Buffer(1)
	        buf.writeUInt8(
	          protocol.codes[type] << protocol.CMD_SHIFT |
	          (dup ? protocol.DUP_MASK : 0) |
	          qos << protocol.QOS_SHIFT | retain, 0, true)
	        return buf
	      })
	    })
	  })
	}

	/* Publish */
	protocol.PUBLISH_HEADER = genHeader('publish')

	/* Subscribe */
	protocol.SUBSCRIBE_HEADER = genHeader('subscribe')

	/* Unsubscribe */
	protocol.UNSUBSCRIBE_HEADER = genHeader('unsubscribe')

	/* Confirmations */
	protocol.ACKS = {
	  unsuback: genHeader('unsuback'),
	  puback: genHeader('puback'),
	  pubcomp: genHeader('pubcomp'),
	  pubrel: genHeader('pubrel'),
	  pubrec: genHeader('pubrec')
	}

	protocol.SUBACK_HEADER = Buffer.from([protocol.codes['suback'] << protocol.CMD_SHIFT])

	/* Protocol versions */
	protocol.VERSION3 = Buffer.from([3])
	protocol.VERSION4 = Buffer.from([4])

	/* QoS */
	protocol.QOS = [0, 1, 2].map(function (qos) {
	  return Buffer.from([qos])
	})

	/* Empty packets */
	protocol.EMPTY = {
	  pingreq: Buffer.from([protocol.codes['pingreq'] << 4, 0]),
	  pingresp: Buffer.from([protocol.codes['pingresp'] << 4, 0]),
	  disconnect: Buffer.from([protocol.codes['disconnect'] << 4, 0])
	}


/***/ }),
/* 159 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	var Buffer = __webpack_require__(57).Buffer
	var writeToStream = __webpack_require__(160)
	var EE = __webpack_require__(3).EventEmitter
	var inherits = __webpack_require__(2)

	function generate (packet) {
	  var stream = new Accumulator()
	  writeToStream(packet, stream)
	  return stream.concat()
	}

	function Accumulator () {
	  this._array = new Array(20)
	  this._i = 0
	}

	inherits(Accumulator, EE)

	Accumulator.prototype.write = function (chunk) {
	  this._array[this._i++] = chunk
	  return true
	}

	Accumulator.prototype.concat = function () {
	  var length = 0
	  var lengths = new Array(this._array.length)
	  var list = this._array
	  var pos = 0
	  var i
	  var result

	  for (i = 0; i < list.length && list[i] !== undefined; i++) {
	    if (typeof list[i] !== 'string') lengths[i] = list[i].length
	    else lengths[i] = Buffer.byteLength(list[i])

	    length += lengths[i]
	  }

	  result = Buffer.allocUnsafe(length)

	  for (i = 0; i < list.length && list[i] !== undefined; i++) {
	    if (typeof list[i] !== 'string') {
	      list[i].copy(result, pos)
	      pos += lengths[i]
	    } else {
	      result.write(list[i], pos)
	      pos += lengths[i]
	    }
	  }

	  return result
	}

	module.exports = generate


/***/ }),
/* 160 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	var protocol = __webpack_require__(158)
	var Buffer = __webpack_require__(57).Buffer
	var empty = Buffer.allocUnsafe(0)
	var zeroBuf = Buffer.from([0])
	var numbers = __webpack_require__(161)
	var nextTick = __webpack_require__(162).nextTick

	var numCache = numbers.cache
	var generateNumber = numbers.generateNumber
	var generateCache = numbers.generateCache
	var writeNumber = writeNumberCached
	var toGenerate = true

	function generate (packet, stream) {
	  if (stream.cork) {
	    stream.cork()
	    nextTick(uncork, stream)
	  }

	  if (toGenerate) {
	    toGenerate = false
	    generateCache()
	  }

	  switch (packet.cmd) {
	    case 'connect':
	      return connect(packet, stream)
	    case 'connack':
	      return connack(packet, stream)
	    case 'publish':
	      return publish(packet, stream)
	    case 'puback':
	    case 'pubrec':
	    case 'pubrel':
	    case 'pubcomp':
	    case 'unsuback':
	      return confirmation(packet, stream)
	    case 'subscribe':
	      return subscribe(packet, stream)
	    case 'suback':
	      return suback(packet, stream)
	    case 'unsubscribe':
	      return unsubscribe(packet, stream)
	    case 'pingreq':
	    case 'pingresp':
	    case 'disconnect':
	      return emptyPacket(packet, stream)
	    default:
	      stream.emit('error', new Error('Unknown command'))
	      return false
	  }
	}
	/**
	 * Controls numbers cache.
	 * Set to "false" to allocate buffers on-the-flight instead of pre-generated cache
	 */
	Object.defineProperty(generate, 'cacheNumbers', {
	  get: function () {
	    return writeNumber === writeNumberCached
	  },
	  set: function (value) {
	    if (value) {
	      if (!numCache || Object.keys(numCache).length === 0) toGenerate = true
	      writeNumber = writeNumberCached
	    } else {
	      toGenerate = false
	      writeNumber = writeNumberGenerated
	    }
	  }
	})

	function uncork (stream) {
	  stream.uncork()
	}

	function connect (opts, stream) {
	  var settings = opts || {}
	  var protocolId = settings.protocolId || 'MQTT'
	  var protocolVersion = settings.protocolVersion || 4
	  var will = settings.will
	  var clean = settings.clean
	  var keepalive = settings.keepalive || 0
	  var clientId = settings.clientId || ''
	  var username = settings.username
	  var password = settings.password

	  if (clean === undefined) clean = true

	  var length = 0

	  // Must be a string and non-falsy
	  if (!protocolId ||
	     (typeof protocolId !== 'string' && !Buffer.isBuffer(protocolId))) {
	    stream.emit('error', new Error('Invalid protocolId'))
	    return false
	  } else length += protocolId.length + 2

	  // Must be 3 or 4
	  if (protocolVersion !== 3 && protocolVersion !== 4) {
	    stream.emit('error', new Error('Invalid protocol version'))
	    return false
	  } else length += 1

	  // ClientId might be omitted in 3.1.1, but only if cleanSession is set to 1
	  if ((typeof clientId === 'string' || Buffer.isBuffer(clientId)) &&
	     (clientId || protocolVersion === 4) && (clientId || clean)) {
	    length += clientId.length + 2
	  } else {
	    if (protocolVersion < 4) {
	      stream.emit('error', new Error('clientId must be supplied before 3.1.1'))
	      return false
	    }
	    if ((clean * 1) === 0) {
	      stream.emit('error', new Error('clientId must be given if cleanSession set to 0'))
	      return false
	    }
	  }

	  // Must be a two byte number
	  if (typeof keepalive !== 'number' ||
	      keepalive < 0 ||
	      keepalive > 65535 ||
	      keepalive % 1 !== 0) {
	    stream.emit('error', new Error('Invalid keepalive'))
	    return false
	  } else length += 2

	  // Connect flags
	  length += 1

	  // If will exists...
	  if (will) {
	    // It must be an object
	    if (typeof will !== 'object') {
	      stream.emit('error', new Error('Invalid will'))
	      return false
	    }
	    // It must have topic typeof string
	    if (!will.topic || typeof will.topic !== 'string') {
	      stream.emit('error', new Error('Invalid will topic'))
	      return false
	    } else {
	      length += Buffer.byteLength(will.topic) + 2
	    }

	    // Payload
	    if (will.payload && will.payload) {
	      if (will.payload.length >= 0) {
	        if (typeof will.payload === 'string') {
	          length += Buffer.byteLength(will.payload) + 2
	        } else {
	          length += will.payload.length + 2
	        }
	      } else {
	        stream.emit('error', new Error('Invalid will payload'))
	        return false
	      }
	    } else {
	      length += 2
	    }
	  }

	  // Username
	  var providedUsername = false
	  if (username != null) {
	    if (isStringOrBuffer(username)) {
	      providedUsername = true
	      length += Buffer.byteLength(username) + 2
	    } else {
	      stream.emit('error', new Error('Invalid username'))
	      return false
	    }
	  }

	  // Password
	  if (password != null) {
	    if (!providedUsername) {
	      stream.emit('error', new Error('Username is required to use password'))
	      return false
	    }

	    if (isStringOrBuffer(password)) {
	      length += byteLength(password) + 2
	    } else {
	      stream.emit('error', new Error('Invalid password'))
	      return false
	    }
	  }

	  // Generate header
	  stream.write(protocol.CONNECT_HEADER)

	  // Generate length
	  writeLength(stream, length)

	  // Generate protocol ID
	  writeStringOrBuffer(stream, protocolId)
	  stream.write(
	    protocolVersion === 4 ? protocol.VERSION4 : protocol.VERSION3
	  )

	  // Connect flags
	  var flags = 0
	  flags |= (username != null) ? protocol.USERNAME_MASK : 0
	  flags |= (password != null) ? protocol.PASSWORD_MASK : 0
	  flags |= (will && will.retain) ? protocol.WILL_RETAIN_MASK : 0
	  flags |= (will && will.qos) ? will.qos << protocol.WILL_QOS_SHIFT : 0
	  flags |= will ? protocol.WILL_FLAG_MASK : 0
	  flags |= clean ? protocol.CLEAN_SESSION_MASK : 0

	  stream.write(Buffer.from([flags]))

	  // Keepalive
	  writeNumber(stream, keepalive)

	  // Client ID
	  writeStringOrBuffer(stream, clientId)

	  // Will
	  if (will) {
	    writeString(stream, will.topic)
	    writeStringOrBuffer(stream, will.payload)
	  }

	  // Username and password
	  if (username != null) {
	    writeStringOrBuffer(stream, username)
	  }
	  if (password != null) {
	    writeStringOrBuffer(stream, password)
	  }
	  // This is a small packet that happens only once on a stream
	  // We assume the stream is always free to receive more data after this
	  return true
	}

	function connack (opts, stream) {
	  var settings = opts || {}
	  var rc = settings.returnCode

	  // Check return code
	  if (typeof rc !== 'number') {
	    stream.emit('error', new Error('Invalid return code'))
	    return false
	  }

	  stream.write(protocol.CONNACK_HEADER)
	  writeLength(stream, 2)
	  stream.write(opts.sessionPresent ? protocol.SESSIONPRESENT_HEADER : zeroBuf)

	  return stream.write(Buffer.from([rc]))
	}

	function publish (opts, stream) {
	  var settings = opts || {}
	  var qos = settings.qos || 0
	  var retain = settings.retain ? protocol.RETAIN_MASK : 0
	  var topic = settings.topic
	  var payload = settings.payload || empty
	  var id = settings.messageId

	  var length = 0

	  // Topic must be a non-empty string or Buffer
	  if (typeof topic === 'string') length += Buffer.byteLength(topic) + 2
	  else if (Buffer.isBuffer(topic)) length += topic.length + 2
	  else {
	    stream.emit('error', new Error('Invalid topic'))
	    return false
	  }

	  // Get the payload length
	  if (!Buffer.isBuffer(payload)) length += Buffer.byteLength(payload)
	  else length += payload.length

	  // Message ID must a number if qos > 0
	  if (qos && typeof id !== 'number') {
	    stream.emit('error', new Error('Invalid messageId'))
	    return false
	  } else if (qos) length += 2

	  // Header
	  stream.write(protocol.PUBLISH_HEADER[qos][opts.dup ? 1 : 0][retain ? 1 : 0])

	  // Remaining length
	  writeLength(stream, length)

	  // Topic
	  writeNumber(stream, byteLength(topic))
	  stream.write(topic)

	  // Message ID
	  if (qos > 0) writeNumber(stream, id)

	  // Payload
	  return stream.write(payload)
	}

	/* Puback, pubrec, pubrel and pubcomp */
	function confirmation (opts, stream) {
	  var settings = opts || {}
	  var type = settings.cmd || 'puback'
	  var id = settings.messageId
	  var dup = (settings.dup && type === 'pubrel') ? protocol.DUP_MASK : 0
	  var qos = 0

	  if (type === 'pubrel') qos = 1

	  // Check message ID
	  if (typeof id !== 'number') {
	    stream.emit('error', new Error('Invalid messageId'))
	    return false
	  }

	  // Header
	  stream.write(protocol.ACKS[type][qos][dup][0])

	  // Length
	  writeLength(stream, 2)

	  // Message ID
	  return writeNumber(stream, id)
	}

	function subscribe (opts, stream) {
	  var settings = opts || {}
	  var dup = settings.dup ? protocol.DUP_MASK : 0
	  var id = settings.messageId
	  var subs = settings.subscriptions

	  var length = 0

	  // Check message ID
	  if (typeof id !== 'number') {
	    stream.emit('error', new Error('Invalid messageId'))
	    return false
	  } else length += 2

	  // Check subscriptions
	  if (typeof subs === 'object' && subs.length) {
	    for (var i = 0; i < subs.length; i += 1) {
	      var itopic = subs[i].topic
	      var iqos = subs[i].qos

	      if (typeof itopic !== 'string') {
	        stream.emit('error', new Error('Invalid subscriptions - invalid topic'))
	        return false
	      }
	      if (typeof iqos !== 'number') {
	        stream.emit('error', new Error('Invalid subscriptions - invalid qos'))
	        return false
	      }

	      length += Buffer.byteLength(itopic) + 2 + 1
	    }
	  } else {
	    stream.emit('error', new Error('Invalid subscriptions'))
	    return false
	  }

	  // Generate header
	  stream.write(protocol.SUBSCRIBE_HEADER[1][dup ? 1 : 0][0])

	  // Generate length
	  writeLength(stream, length)

	  // Generate message ID
	  writeNumber(stream, id)

	  var result = true

	  // Generate subs
	  for (var j = 0; j < subs.length; j++) {
	    var sub = subs[j]
	    var jtopic = sub.topic
	    var jqos = sub.qos

	    // Write topic string
	    writeString(stream, jtopic)

	    // Write qos
	    result = stream.write(protocol.QOS[jqos])
	  }

	  return result
	}

	function suback (opts, stream) {
	  var settings = opts || {}
	  var id = settings.messageId
	  var granted = settings.granted

	  var length = 0

	  // Check message ID
	  if (typeof id !== 'number') {
	    stream.emit('error', new Error('Invalid messageId'))
	    return false
	  } else length += 2

	  // Check granted qos vector
	  if (typeof granted === 'object' && granted.length) {
	    for (var i = 0; i < granted.length; i += 1) {
	      if (typeof granted[i] !== 'number') {
	        stream.emit('error', new Error('Invalid qos vector'))
	        return false
	      }
	      length += 1
	    }
	  } else {
	    stream.emit('error', new Error('Invalid qos vector'))
	    return false
	  }

	  // header
	  stream.write(protocol.SUBACK_HEADER)

	  // Length
	  writeLength(stream, length)

	  // Message ID
	  writeNumber(stream, id)

	  return stream.write(Buffer.from(granted))
	}

	function unsubscribe (opts, stream) {
	  var settings = opts || {}
	  var id = settings.messageId
	  var dup = settings.dup ? protocol.DUP_MASK : 0
	  var unsubs = settings.unsubscriptions

	  var length = 0

	  // Check message ID
	  if (typeof id !== 'number') {
	    stream.emit('error', new Error('Invalid messageId'))
	    return false
	  } else {
	    length += 2
	  }
	  // Check unsubs
	  if (typeof unsubs === 'object' && unsubs.length) {
	    for (var i = 0; i < unsubs.length; i += 1) {
	      if (typeof unsubs[i] !== 'string') {
	        stream.emit('error', new Error('Invalid unsubscriptions'))
	        return false
	      }
	      length += Buffer.byteLength(unsubs[i]) + 2
	    }
	  } else {
	    stream.emit('error', new Error('Invalid unsubscriptions'))
	    return false
	  }

	  // Header
	  stream.write(protocol.UNSUBSCRIBE_HEADER[1][dup ? 1 : 0][0])

	  // Length
	  writeLength(stream, length)

	  // Message ID
	  writeNumber(stream, id)

	  // Unsubs
	  var result = true
	  for (var j = 0; j < unsubs.length; j++) {
	    result = writeString(stream, unsubs[j])
	  }

	  return result
	}

	function emptyPacket (opts, stream) {
	  return stream.write(protocol.EMPTY[opts.cmd])
	}

	/**
	 * calcLengthLength - calculate the length of the remaining
	 * length field
	 *
	 * @api private
	 */
	function calcLengthLength (length) {
	  if (length >= 0 && length < 128) return 1
	  else if (length >= 128 && length < 16384) return 2
	  else if (length >= 16384 && length < 2097152) return 3
	  else if (length >= 2097152 && length < 268435456) return 4
	  else return 0
	}

	function genBufLength (length) {
	  var digit = 0
	  var pos = 0
	  var buffer = Buffer.allocUnsafe(calcLengthLength(length))

	  do {
	    digit = length % 128 | 0
	    length = length / 128 | 0
	    if (length > 0) digit = digit | 0x80

	    buffer.writeUInt8(digit, pos++)
	  } while (length > 0)

	  return buffer
	}

	/**
	 * writeLength - write an MQTT style length field to the buffer
	 *
	 * @param <Buffer> buffer - destination
	 * @param <Number> pos - offset
	 * @param <Number> length - length (>0)
	 * @returns <Number> number of bytes written
	 *
	 * @api private
	 */

	var lengthCache = {}
	function writeLength (stream, length) {
	  var buffer = lengthCache[length]

	  if (!buffer) {
	    buffer = genBufLength(length)
	    if (length < 16384) lengthCache[length] = buffer
	  }

	  stream.write(buffer)
	}

	/**
	 * writeString - write a utf8 string to the buffer
	 *
	 * @param <Buffer> buffer - destination
	 * @param <Number> pos - offset
	 * @param <String> string - string to write
	 * @return <Number> number of bytes written
	 *
	 * @api private
	 */

	function writeString (stream, string) {
	  var strlen = Buffer.byteLength(string)
	  writeNumber(stream, strlen)

	  stream.write(string, 'utf8')
	}

	/**
	 * writeNumber - write a two byte number to the buffer
	 *
	 * @param <Buffer> buffer - destination
	 * @param <Number> pos - offset
	 * @param <String> number - number to write
	 * @return <Number> number of bytes written
	 *
	 * @api private
	 */
	function writeNumberCached (stream, number) {
	  return stream.write(numCache[number])
	}
	function writeNumberGenerated (stream, number) {
	  return stream.write(generateNumber(number))
	}

	/**
	 * writeStringOrBuffer - write a String or Buffer with the its length prefix
	 *
	 * @param <Buffer> buffer - destination
	 * @param <Number> pos - offset
	 * @param <String> toWrite - String or Buffer
	 * @return <Number> number of bytes written
	 */
	function writeStringOrBuffer (stream, toWrite) {
	  if (typeof toWrite === 'string') {
	    writeString(stream, toWrite)
	  } else if (toWrite) {
	    writeNumber(stream, toWrite.length)
	    stream.write(toWrite)
	  } else writeNumber(stream, 0)
	}

	function byteLength (bufOrString) {
	  if (!bufOrString) return 0
	  else if (bufOrString instanceof Buffer) return bufOrString.length
	  else return Buffer.byteLength(bufOrString)
	}

	function isStringOrBuffer (field) {
	  return typeof field === 'string' || field instanceof Buffer
	}

	module.exports = generate


/***/ }),
/* 161 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	var Buffer = __webpack_require__(57).Buffer
	var max = 65536
	var cache = {}

	function generateBuffer (i) {
	  var buffer = Buffer.allocUnsafe(2)
	  buffer.writeUInt8(i >> 8, 0)
	  buffer.writeUInt8(i & 0x00FF, 0 + 1)

	  return buffer
	}

	function generateCache () {
	  for (var i = 0; i < max; i++) {
	    cache[i] = generateBuffer(i)
	  }
	}

	module.exports = {
	  cache: cache,
	  generateCache: generateCache,
	  generateNumber: generateBuffer
	}


/***/ }),
/* 162 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = { nextTick: nextTick };
	} else {
	  module.exports = process
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 163 */
/***/ (function(module, exports) {

	'use strict'

	function ReInterval (callback, interval, args) {
	  var self = this;

	  this._callback = callback;
	  this._args = args;

	  this._interval = setInterval(callback, interval, this._args);

	  this.reschedule = function (interval) {
	    // if no interval entered, use the interval passed in on creation
	    if (!interval)
	      interval = self._interval;

	    if (self._interval)
	      clearInterval(self._interval);
	    self._interval = setInterval(self._callback, interval, self._args);
	  };

	  this.clear = function () {
	    if (self._interval) {
	      clearInterval(self._interval);
	      self._interval = undefined;
	    }
	  };
	  
	  this.destroy = function () {
	    if (self._interval) {
	      clearInterval(self._interval);
	    }
	    self._callback = undefined;
	    self._interval = undefined;
	    self._args = undefined;
	  };
	}

	function reInterval () {
	  if (typeof arguments[0] !== 'function')
	    throw new Error('callback needed');
	  if (typeof arguments[1] !== 'number')
	    throw new Error('interval needed');

	  var args;

	  if (arguments.length > 0) {
	    args = new Array(arguments.length - 2);

	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i + 2];
	    }
	  }

	  return new ReInterval(arguments[0], arguments[1], args);
	}

	module.exports = reInterval;


/***/ }),
/* 164 */
/***/ (function(module, exports) {

	'use strict'

	/**
	 * Validate a topic to see if it's valid or not.
	 * A topic is valid if it follow below rules:
	 * - Rule #1: If any part of the topic is not `+` or `#`, then it must not contain `+` and '#'
	 * - Rule #2: Part `#` must be located at the end of the mailbox
	 *
	 * @param {String} topic - A topic
	 * @returns {Boolean} If the topic is valid, returns true. Otherwise, returns false.
	 */
	function validateTopic (topic) {
	  var parts = topic.split('/')

	  for (var i = 0; i < parts.length; i++) {
	    if (parts[i] === '+') {
	      continue
	    }

	    if (parts[i] === '#') {
	      // for Rule #2
	      return i === parts.length - 1
	    }

	    if (parts[i].indexOf('+') !== -1 || parts[i].indexOf('#') !== -1) {
	      return false
	    }
	  }

	  return true
	}

	/**
	 * Validate an array of topics to see if any of them is valid or not
	  * @param {Array} topics - Array of topics
	 * @returns {String} If the topics is valid, returns null. Otherwise, returns the invalid one
	 */
	function validateTopics (topics) {
	  if (topics.length === 0) {
	    return 'empty_topic_list'
	  }
	  for (var i = 0; i < topics.length; i++) {
	    if (!validateTopic(topics[i])) {
	      return topics[i]
	    }
	  }
	  return null
	}

	module.exports = {
	  validateTopics: validateTopics
	}


/***/ }),
/* 165 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var punycode = __webpack_require__(166);
	var util = __webpack_require__(168);

	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;

	exports.Url = Url;

	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    // Special case for a simple path URL
	    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(169);

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && util.isObject(url) && url instanceof Url) return url;

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!util.isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }

	  // Copy chrome, IE, opera backslash-handling behavior.
	  // Back slashes before the query string get converted to forward slashes
	  // See: https://code.google.com/p/chromium/issues/detail?id=25916
	  var queryIndex = url.indexOf('?'),
	      splitter =
	          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
	      uSplit = url.split(splitter),
	      slashRegex = /\\/g;
	  uSplit[0] = uSplit[0].replace(slashRegex, '/');
	  url = uSplit.join(splitter);

	  var rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  if (!slashesDenoteHost && url.split('#').length === 1) {
	    // Try fast path regexp
	    var simplePath = simplePathPattern.exec(rest);
	    if (simplePath) {
	      this.path = rest;
	      this.href = rest;
	      this.pathname = simplePath[1];
	      if (simplePath[2]) {
	        this.search = simplePath[2];
	        if (parseQueryString) {
	          this.query = querystring.parse(this.search.substr(1));
	        } else {
	          this.query = this.search.substr(1);
	        }
	      } else if (parseQueryString) {
	        this.search = '';
	        this.query = {};
	      }
	      return this;
	    }
	  }

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;

	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    this.parseHost();

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a punycoded representation of "domain".
	      // It only converts parts of the domain name that
	      // have non-ASCII characters, i.e. it doesn't matter if
	      // you call it with a domain that already is ASCII-only.
	      this.hostname = punycode.toASCII(this.hostname);
	    }

	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {

	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      if (rest.indexOf(ae) === -1)
	        continue;
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }

	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }

	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};

	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (util.isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}

	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';

	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }

	  if (this.query &&
	      util.isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }

	  var search = this.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (util.isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  var tkeys = Object.keys(this);
	  for (var tk = 0; tk < tkeys.length; tk++) {
	    var tkey = tkeys[tk];
	    result[tkey] = this[tkey];
	  }

	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;

	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    var rkeys = Object.keys(relative);
	    for (var rk = 0; rk < rkeys.length; rk++) {
	      var rkey = rkeys[rk];
	      if (rkey !== 'protocol')
	        result[rkey] = relative[rkey];
	    }

	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }

	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      var keys = Object.keys(relative);
	      for (var v = 0; v < keys.length; v++) {
	        var k = keys[v];
	        result[k] = relative[k];
	      }
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];

	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }

	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!util.isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especially happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host || srcPath.length > 1) &&
	      (last === '.' || last === '..') || last === '');

	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last === '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');

	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especially happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  //to support request.http
	  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};


/***/ }),
/* 166 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {

		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);

			// Cache the length
			inputLength = input.length;

			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;

			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(167)(module), (function() { return this; }())))

/***/ }),
/* 167 */
/***/ (function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }),
/* 168 */
/***/ (function(module, exports) {

	'use strict';

	module.exports = {
	  isString: function(arg) {
	    return typeof(arg) === 'string';
	  },
	  isObject: function(arg) {
	    return typeof(arg) === 'object' && arg !== null;
	  },
	  isNull: function(arg) {
	    return arg === null;
	  },
	  isNullOrUndefined: function(arg) {
	    return arg == null;
	  }
	};


/***/ }),
/* 169 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(170);
	exports.encode = exports.stringify = __webpack_require__(171);


/***/ }),
/* 170 */
/***/ (function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};


/***/ }),
/* 171 */
/***/ (function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ }),
/* 172 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'
	var net = __webpack_require__(173)

	/*
	  variables port and host can be removed since
	  you have all required information in opts object
	*/
	function buildBuilder (client, opts) {
	  var port, host
	  opts.port = opts.port || 1883
	  opts.hostname = opts.hostname || opts.host || 'localhost'

	  port = opts.port
	  host = opts.hostname

	  return net.createConnection(port, host)
	}

	module.exports = buildBuilder


/***/ }),
/* 173 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 174 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'
	var tls = __webpack_require__(175)

	function buildBuilder (mqttClient, opts) {
	  var connection
	  opts.port = opts.port || 8883
	  opts.host = opts.hostname || opts.host || 'localhost'

	  opts.rejectUnauthorized = opts.rejectUnauthorized !== false

	  delete opts.path

	  connection = tls.connect(opts)
	  /* eslint no-use-before-define: [2, "nofunc"] */
	  connection.on('secureConnect', function () {
	    if (opts.rejectUnauthorized && !connection.authorized) {
	      connection.emit('error', new Error('TLS not authorized'))
	    } else {
	      connection.removeListener('error', handleTLSerrors)
	    }
	  })

	  function handleTLSerrors (err) {
	    // How can I get verify this error is a tls error?
	    if (opts.rejectUnauthorized) {
	      mqttClient.emit('error', err)
	    }

	    // close this connection to match the behaviour of net
	    // otherwise all we get is an error from the connection
	    // and close event doesn't fire. This is a work around
	    // to enable the reconnect code to work the same as with
	    // net.createConnection
	    connection.end()
	  }

	  connection.on('error', handleTLSerrors)
	  return connection
	}

	module.exports = buildBuilder


/***/ }),
/* 175 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict'

	/* global wx */
	var socketOpen = false
	var socketMsgQueue = []

	function sendSocketMessage (msg) {
	  if (socketOpen) {
	    wx.sendSocketMessage({
	      data: msg.buffer || msg
	    })
	  } else {
	    socketMsgQueue.push(msg)
	  }
	}

	function WebSocket (url, protocols) {
	  var ws = {
	    OPEN: 1,
	    CLOSING: 2,
	    CLOSED: 3,
	    readyState: socketOpen ? 1 : 0,
	    send: sendSocketMessage,
	    close: wx.closeSocket,
	    onopen: null,
	    onmessage: null,
	    onclose: null,
	    onerror: null
	  }

	  wx.connectSocket({
	    url: url,
	    protocols: protocols
	  })
	  wx.onSocketOpen(function (res) {
	    ws.readyState = ws.OPEN
	    socketOpen = true
	    for (var i = 0; i < socketMsgQueue.length; i++) {
	      sendSocketMessage(socketMsgQueue[i])
	    }
	    socketMsgQueue = []

	    ws.onopen && ws.onopen.apply(ws, arguments)
	  })
	  wx.onSocketMessage(function (res) {
	    ws.onmessage && ws.onmessage.apply(ws, arguments)
	  })
	  wx.onSocketClose(function () {
	    ws.onclose && ws.onclose.apply(ws, arguments)
	    ws.readyState = ws.CLOSED
	    socketOpen = false
	  })
	  wx.onSocketError(function () {
	    ws.onerror && ws.onerror.apply(ws, arguments)
	    ws.readyState = ws.CLOSED
	    socketOpen = false
	  })

	  return ws
	}

	var websocket = __webpack_require__(177)

	function buildUrl (opts, client) {
	  var protocol = opts.protocol === 'wxs' ? 'wss' : 'ws'
	  var url = protocol + '://' + opts.hostname + opts.path
	  if (opts.port && opts.port !== 80 && opts.port !== 443) {
	    url = protocol + '://' + opts.hostname + ':' + opts.port + opts.path
	  }
	  if (typeof (opts.transformWsUrl) === 'function') {
	    url = opts.transformWsUrl(url, opts, client)
	  }
	  return url
	}

	function setDefaultOpts (opts) {
	  if (!opts.hostname) {
	    opts.hostname = 'localhost'
	  }
	  if (!opts.path) {
	    opts.path = '/'
	  }

	  if (!opts.wsOptions) {
	    opts.wsOptions = {}
	  }
	}

	function createWebSocket (client, opts) {
	  var websocketSubProtocol =
	    (opts.protocolId === 'MQIsdp') && (opts.protocolVersion === 3)
	      ? 'mqttv3.1'
	      : 'mqtt'

	  setDefaultOpts(opts)
	  var url = buildUrl(opts, client)
	  return websocket(WebSocket(url, [websocketSubProtocol]))
	}

	function buildBuilder (client, opts) {
	  opts.hostname = opts.hostname || opts.host

	  if (!opts.hostname) {
	    throw new Error('Could not determine host. Specify host manually.')
	  }

	  return createWebSocket(client, opts)
	}

	module.exports = buildBuilder


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, global) {'use strict'

	var Transform = __webpack_require__(178).Transform
	var duplexify = __webpack_require__(191)
	var WS = __webpack_require__(207)
	var Buffer = __webpack_require__(57).Buffer

	module.exports = WebSocketStream

	function buildProxy (options, socketWrite, socketEnd) {
	  var proxy = new Transform({
	    objectMode: options.objectMode
	  })

	  proxy._write = socketWrite
	  proxy._flush = socketEnd

	  return proxy
	}

	function WebSocketStream(target, protocols, options) {
	  var stream, socket

	  var isBrowser = process.title === 'browser'
	  var isNative = !!global.WebSocket
	  var socketWrite = isBrowser ? socketWriteBrowser : socketWriteNode

	  if (protocols && !Array.isArray(protocols) && 'object' === typeof protocols) {
	    // accept the "options" Object as the 2nd argument
	    options = protocols
	    protocols = null

	    if (typeof options.protocol === 'string' || Array.isArray(options.protocol)) {
	      protocols = options.protocol;
	    }
	  }

	  if (!options) options = {}

	  if (options.objectMode === undefined) {
	    options.objectMode = !(options.binary === true || options.binary === undefined)
	  }

	  var proxy = buildProxy(options, socketWrite, socketEnd)

	  if (!options.objectMode) {
	    proxy._writev = writev
	  }

	  // browser only: sets the maximum socket buffer size before throttling
	  var bufferSize = options.browserBufferSize || 1024 * 512

	  // browser only: how long to wait when throttling
	  var bufferTimeout = options.browserBufferTimeout || 1000

	  // use existing WebSocket object that was passed in
	  if (typeof target === 'object') {
	    socket = target
	  // otherwise make a new one
	  } else {
	    // special constructor treatment for native websockets in browsers, see
	    // https://github.com/maxogden/websocket-stream/issues/82
	    if (isNative && isBrowser) {
	      socket = new WS(target, protocols)
	    } else {
	      socket = new WS(target, protocols, options)
	    }

	    socket.binaryType = 'arraybuffer'
	  }

	  // was already open when passed in
	  if (socket.readyState === socket.OPEN) {
	    stream = proxy
	  } else {
	    stream = duplexify.obj()
	    socket.onopen = onopen
	  }

	  stream.socket = socket

	  socket.onclose = onclose
	  socket.onerror = onerror
	  socket.onmessage = onmessage

	  proxy.on('close', destroy)

	  var coerceToBuffer = !options.objectMode

	  function socketWriteNode(chunk, enc, next) {
	    // avoid errors, this never happens unless
	    // destroy() is called
	    if (socket.readyState !== socket.OPEN) {
	      next()
	      return
	    }

	    if (coerceToBuffer && typeof chunk === 'string') {
	      chunk = Buffer.from(chunk, 'utf8')
	    }
	    socket.send(chunk, next)
	  }

	  function socketWriteBrowser(chunk, enc, next) {
	    if (socket.bufferedAmount > bufferSize) {
	      setTimeout(socketWriteBrowser, bufferTimeout, chunk, enc, next)
	      return
	    }

	    if (coerceToBuffer && typeof chunk === 'string') {
	      chunk = Buffer.from(chunk, 'utf8')
	    }

	    try {
	      socket.send(chunk)
	    } catch(err) {
	      return next(err)
	    }

	    next()
	  }

	  function socketEnd(done) {
	    socket.close()
	    done()
	  }

	  function onopen() {
	    stream.setReadable(proxy)
	    stream.setWritable(proxy)
	    stream.emit('connect')
	  }

	  function onclose() {
	    stream.end()
	    stream.destroy()
	  }

	  function onerror(err) {
	    stream.destroy(err)
	  }

	  function onmessage(event) {
	    var data = event.data
	    if (data instanceof ArrayBuffer) data = Buffer.from(data)
	    else data = Buffer.from(data, 'utf8')
	    proxy.push(data)
	  }

	  function destroy() {
	    socket.close()
	  }

	  // this is to be enabled only if objectMode is false
	  function writev (chunks, cb) {
	    var buffers = new Array(chunks.length)
	    for (var i = 0; i < chunks.length; i++) {
	      if (typeof chunks[i].chunk === 'string') {
	        buffers[i] = Buffer.from(chunks[i], 'utf8')
	      } else {
	        buffers[i] = chunks[i].chunk
	      }
	    }

	    this._write(Buffer.concat(buffers), 'binary', cb)
	  }

	  return stream
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48), (function() { return this; }())))

/***/ }),
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(179);
	exports.Stream = exports;
	exports.Readable = exports;
	exports.Writable = __webpack_require__(187);
	exports.Duplex = __webpack_require__(186);
	exports.Transform = __webpack_require__(189);
	exports.PassThrough = __webpack_require__(190);


/***/ }),
/* 179 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(180);
	/*</replacement>*/

	module.exports = Readable;

	/*<replacement>*/
	var isArray = __webpack_require__(55);
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	/*<replacement>*/
	var EE = __webpack_require__(3).EventEmitter;

	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(181);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var debugUtil = __webpack_require__(182);
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/

	var BufferList = __webpack_require__(183);
	var destroyImpl = __webpack_require__(185);
	var StringDecoder;

	util.inherits(Readable, Stream);

	var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

	function prependListener(emitter, event, fn) {
	  // Sadly this is not cacheable as some libraries bundle their own
	  // event emitter implementation with them.
	  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

	  // This is a hack to make sure that our error handler is attached before any
	  // userland ones.  NEVER DO THIS. This is here only because this code needs
	  // to continue to work with older versions of Node.js that do not include
	  // the prependListener() method. The goal is to eventually remove this hack.
	  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
	}

	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(186);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var readableHwm = options.readableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // A linked list is used to store data chunks instead of an array because the
	  // linked list can remove elements from the beginning faster than
	  // array.shift()
	  this.buffer = new BufferList();
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the event 'readable'/'data' is emitted
	  // immediately, or on a later tick.  We set this to true at first, because
	  // any actions that shouldn't happen until "later" should generally also
	  // not happen before the first read call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(188).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(186);

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options) {
	    if (typeof options.read === 'function') this._read = options.read;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;
	  }

	  Stream.call(this);
	}

	Object.defineProperty(Readable.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._readableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	  }
	});

	Readable.prototype.destroy = destroyImpl.destroy;
	Readable.prototype._undestroy = destroyImpl.undestroy;
	Readable.prototype._destroy = function (err, cb) {
	  this.push(null);
	  cb(err);
	};

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;
	  var skipChunkCheck;

	  if (!state.objectMode) {
	    if (typeof chunk === 'string') {
	      encoding = encoding || state.defaultEncoding;
	      if (encoding !== state.encoding) {
	        chunk = Buffer.from(chunk, encoding);
	        encoding = '';
	      }
	      skipChunkCheck = true;
	    }
	  } else {
	    skipChunkCheck = true;
	  }

	  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  return readableAddChunk(this, chunk, null, true, false);
	};

	function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
	  var state = stream._readableState;
	  if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else {
	    var er;
	    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
	    if (er) {
	      stream.emit('error', er);
	    } else if (state.objectMode || chunk && chunk.length > 0) {
	      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
	        chunk = _uint8ArrayToBuffer(chunk);
	      }

	      if (addToFront) {
	        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
	      } else if (state.ended) {
	        stream.emit('error', new Error('stream.push() after EOF'));
	      } else {
	        state.reading = false;
	        if (state.decoder && !encoding) {
	          chunk = state.decoder.write(chunk);
	          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
	        } else {
	          addChunk(stream, state, chunk, false);
	        }
	      }
	    } else if (!addToFront) {
	      state.reading = false;
	    }
	  }

	  return needMoreData(state);
	}

	function addChunk(stream, state, chunk, addToFront) {
	  if (state.flowing && state.length === 0 && !state.sync) {
	    stream.emit('data', chunk);
	    stream.read(0);
	  } else {
	    // update the buffer info.
	    state.length += state.objectMode ? 1 : chunk.length;
	    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	    if (state.needReadable) emitReadable(stream);
	  }
	  maybeReadMore(stream, state);
	}

	function chunkInvalid(state, chunk) {
	  var er;
	  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(188).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2 to prevent increasing hwm excessively in
	    // tiny amounts
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function howMuchToRead(n, state) {
	  if (n <= 0 || state.length === 0 && state.ended) return 0;
	  if (state.objectMode) return 1;
	  if (n !== n) {
	    // Only flow one buffer at a time
	    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
	  }
	  // If we're asking for more than the current hwm, then raise the hwm.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
	  if (n <= state.length) return n;
	  // Don't have enough
	  if (!state.ended) {
	    state.needReadable = true;
	    return 0;
	  }
	  return state.length;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  n = parseInt(n, 10);
	  var state = this._readableState;
	  var nOrig = n;

	  if (n !== 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  } else if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	    // If _read pushed data synchronously, then `reading` will be false,
	    // and we need to re-evaluate how much data we can return to the user.
	    if (!state.reading) n = howMuchToRead(nOrig, state);
	  }

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  } else {
	    state.length -= n;
	  }

	  if (state.length === 0) {
	    // If we have nothing in the buffer, then we want to know
	    // as soon as we *do* get something into the buffer.
	    if (!state.ended) state.needReadable = true;

	    // If we tried to read() past the EOF, then emit end on the next tick.
	    if (nOrig !== n && state.ended) endReadable(this);
	  }

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    pna.nextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('_read() is not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

	  var endFn = doEnd ? onend : unpipe;
	  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable, unpipeInfo) {
	    debug('onunpipe');
	    if (readable === src) {
	      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
	        unpipeInfo.hasUnpiped = true;
	        cleanup();
	      }
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', unpipe);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  // If the user pushes more data while we're writing to dest then we'll end up
	  // in ondata again. However, we only want to increase awaitDrain once because
	  // dest will only emit one 'drain' event for the multiple writes.
	  // => Introduce a guard on increasing awaitDrain.
	  var increasedAwaitDrain = false;
	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    increasedAwaitDrain = false;
	    var ret = dest.write(chunk);
	    if (false === ret && !increasedAwaitDrain) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      // => Check whether `dest` is still a piping destination.
	      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	        increasedAwaitDrain = true;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }

	  // Make sure our error handler is attached before userland ones.
	  prependListener(dest, 'error', onerror);

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;
	  var unpipeInfo = { hasUnpiped: false };

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this, unpipeInfo);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var i = 0; i < len; i++) {
	      dests[i].emit('unpipe', this, unpipeInfo);
	    }return this;
	  }

	  // try to find the right one.
	  var index = indexOf(state.pipes, dest);
	  if (index === -1) return this;

	  state.pipes.splice(index, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this, unpipeInfo);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  if (ev === 'data') {
	    // Start flowing on next tick if stream isn't explicitly paused
	    if (this._readableState.flowing !== false) this.resume();
	  } else if (ev === 'readable') {
	    var state = this._readableState;
	    if (!state.endEmitted && !state.readableListening) {
	      state.readableListening = state.needReadable = true;
	      state.emittedReadable = false;
	      if (!state.reading) {
	        pna.nextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    pna.nextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  state.awaitDrain = 0;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  while (state.flowing && stream.read() !== null) {}
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var _this = this;

	  var state = this._readableState;
	  var paused = false;

	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) _this.push(chunk);
	    }

	    _this.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = _this.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  for (var n = 0; n < kProxyEvents.length; n++) {
	    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
	  }

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  this._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return this;
	};

	Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._readableState.highWaterMark;
	  }
	});

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromList(n, state) {
	  // nothing buffered
	  if (state.length === 0) return null;

	  var ret;
	  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
	    // read it all, truncate the list
	    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
	    state.buffer.clear();
	  } else {
	    // read part of list
	    ret = fromListPartial(n, state.buffer, state.decoder);
	  }

	  return ret;
	}

	// Extracts only enough buffered data to satisfy the amount requested.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function fromListPartial(n, list, hasStrings) {
	  var ret;
	  if (n < list.head.data.length) {
	    // slice is the same for buffers and strings
	    ret = list.head.data.slice(0, n);
	    list.head.data = list.head.data.slice(n);
	  } else if (n === list.head.data.length) {
	    // first chunk is a perfect match
	    ret = list.shift();
	  } else {
	    // result spans more than one buffer
	    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
	  }
	  return ret;
	}

	// Copies a specified amount of characters from the list of buffered data
	// chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBufferString(n, list) {
	  var p = list.head;
	  var c = 1;
	  var ret = p.data;
	  n -= ret.length;
	  while (p = p.next) {
	    var str = p.data;
	    var nb = n > str.length ? str.length : n;
	    if (nb === str.length) ret += str;else ret += str.slice(0, n);
	    n -= nb;
	    if (n === 0) {
	      if (nb === str.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = str.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	// Copies a specified amount of bytes from the list of buffered data chunks.
	// This function is designed to be inlinable, so please take care when making
	// changes to the function body.
	function copyFromBuffer(n, list) {
	  var ret = Buffer.allocUnsafe(n);
	  var p = list.head;
	  var c = 1;
	  p.data.copy(ret);
	  n -= p.data.length;
	  while (p = p.next) {
	    var buf = p.data;
	    var nb = n > buf.length ? buf.length : n;
	    buf.copy(ret, ret.length - n, 0, nb);
	    n -= nb;
	    if (n === 0) {
	      if (nb === buf.length) {
	        ++c;
	        if (p.next) list.head = p.next;else list.head = list.tail = null;
	      } else {
	        list.head = p;
	        p.data = buf.slice(nb);
	      }
	      break;
	    }
	    ++c;
	  }
	  list.length -= c;
	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    pna.nextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(48)))

/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = { nextTick: nextTick };
	} else {
	  module.exports = process
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(3).EventEmitter;


/***/ }),
/* 182 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 183 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Buffer = __webpack_require__(57).Buffer;
	var util = __webpack_require__(184);

	function copyBuffer(src, target, offset) {
	  src.copy(target, offset);
	}

	module.exports = function () {
	  function BufferList() {
	    _classCallCheck(this, BufferList);

	    this.head = null;
	    this.tail = null;
	    this.length = 0;
	  }

	  BufferList.prototype.push = function push(v) {
	    var entry = { data: v, next: null };
	    if (this.length > 0) this.tail.next = entry;else this.head = entry;
	    this.tail = entry;
	    ++this.length;
	  };

	  BufferList.prototype.unshift = function unshift(v) {
	    var entry = { data: v, next: this.head };
	    if (this.length === 0) this.tail = entry;
	    this.head = entry;
	    ++this.length;
	  };

	  BufferList.prototype.shift = function shift() {
	    if (this.length === 0) return;
	    var ret = this.head.data;
	    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
	    --this.length;
	    return ret;
	  };

	  BufferList.prototype.clear = function clear() {
	    this.head = this.tail = null;
	    this.length = 0;
	  };

	  BufferList.prototype.join = function join(s) {
	    if (this.length === 0) return '';
	    var p = this.head;
	    var ret = '' + p.data;
	    while (p = p.next) {
	      ret += s + p.data;
	    }return ret;
	  };

	  BufferList.prototype.concat = function concat(n) {
	    if (this.length === 0) return Buffer.alloc(0);
	    if (this.length === 1) return this.head.data;
	    var ret = Buffer.allocUnsafe(n >>> 0);
	    var p = this.head;
	    var i = 0;
	    while (p) {
	      copyBuffer(p.data, ret, i);
	      i += p.data.length;
	      p = p.next;
	    }
	    return ret;
	  };

	  return BufferList;
	}();

	if (util && util.inspect && util.inspect.custom) {
	  module.exports.prototype[util.inspect.custom] = function () {
	    var obj = util.inspect({ length: this.length });
	    return this.constructor.name + ' ' + obj;
	  };
	}

/***/ }),
/* 184 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 185 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(180);
	/*</replacement>*/

	// undocumented cb() API, needed for core, not for public API
	function destroy(err, cb) {
	  var _this = this;

	  var readableDestroyed = this._readableState && this._readableState.destroyed;
	  var writableDestroyed = this._writableState && this._writableState.destroyed;

	  if (readableDestroyed || writableDestroyed) {
	    if (cb) {
	      cb(err);
	    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
	      pna.nextTick(emitErrorNT, this, err);
	    }
	    return this;
	  }

	  // we set destroyed to true before firing error callbacks in order
	  // to make it re-entrance safe in case destroy() is called within callbacks

	  if (this._readableState) {
	    this._readableState.destroyed = true;
	  }

	  // if this is a duplex stream mark the writable part as destroyed as well
	  if (this._writableState) {
	    this._writableState.destroyed = true;
	  }

	  this._destroy(err || null, function (err) {
	    if (!cb && err) {
	      pna.nextTick(emitErrorNT, _this, err);
	      if (_this._writableState) {
	        _this._writableState.errorEmitted = true;
	      }
	    } else if (cb) {
	      cb(err);
	    }
	  });

	  return this;
	}

	function undestroy() {
	  if (this._readableState) {
	    this._readableState.destroyed = false;
	    this._readableState.reading = false;
	    this._readableState.ended = false;
	    this._readableState.endEmitted = false;
	  }

	  if (this._writableState) {
	    this._writableState.destroyed = false;
	    this._writableState.ended = false;
	    this._writableState.ending = false;
	    this._writableState.finished = false;
	    this._writableState.errorEmitted = false;
	  }
	}

	function emitErrorNT(self, err) {
	  self.emit('error', err);
	}

	module.exports = {
	  destroy: destroy,
	  undestroy: undestroy
	};

/***/ }),
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(180);
	/*</replacement>*/

	/*<replacement>*/
	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/

	module.exports = Duplex;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	var Readable = __webpack_require__(179);
	var Writable = __webpack_require__(187);

	util.inherits(Duplex, Readable);

	{
	  // avoid scope creep, the keys array can then be collected
	  var keys = objectKeys(Writable.prototype);
	  for (var v = 0; v < keys.length; v++) {
	    var method = keys[v];
	    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	  }
	}

	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  pna.nextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	Object.defineProperty(Duplex.prototype, 'destroyed', {
	  get: function () {
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return false;
	    }
	    return this._readableState.destroyed && this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (this._readableState === undefined || this._writableState === undefined) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._readableState.destroyed = value;
	    this._writableState.destroyed = value;
	  }
	});

	Duplex.prototype._destroy = function (err, cb) {
	  this.push(null);
	  this.end();

	  pna.nextTick(cb, err);
	};

/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate, global) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	'use strict';

	/*<replacement>*/

	var pna = __webpack_require__(180);
	/*</replacement>*/

	module.exports = Writable;

	/* <replacement> */
	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;
	  this.finish = function () {
	    onCorkedFinish(_this, state);
	  };
	}
	/* </replacement> */

	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
	/*</replacement>*/

	/*<replacement>*/
	var Duplex;
	/*</replacement>*/

	Writable.WritableState = WritableState;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(71)
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream = __webpack_require__(181);
	/*</replacement>*/

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	var OurUint8Array = global.Uint8Array || function () {};
	function _uint8ArrayToBuffer(chunk) {
	  return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
	  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}

	/*</replacement>*/

	var destroyImpl = __webpack_require__(185);

	util.inherits(Writable, Stream);

	function nop() {}

	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(186);

	  options = options || {};

	  // Duplex streams are both readable and writable, but share
	  // the same options object.
	  // However, some cases require setting options to different
	  // values for the readable and the writable sides of the duplex stream.
	  // These options can be provided separately as readableXXX and writableXXX.
	  var isDuplex = stream instanceof Duplex;

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var writableHwm = options.writableHighWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

	  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

	  // cast to ints.
	  this.highWaterMark = Math.floor(this.highWaterMark);

	  // if _final has been called
	  this.finalCalled = false;

	  // drain event flag.
	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // has it been destroyed
	  this.destroyed = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // allocate the first CorkedRequest, there is always
	  // one allocated and free to use, and we maintain at most two
	  this.corkedRequestsFree = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function getBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};

	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
	    });
	  } catch (_) {}
	})();

	// Test _writableState for inheritance to account for Duplex streams,
	// whose prototype chain only points to Readable.
	var realHasInstance;
	if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
	  realHasInstance = Function.prototype[Symbol.hasInstance];
	  Object.defineProperty(Writable, Symbol.hasInstance, {
	    value: function (object) {
	      if (realHasInstance.call(this, object)) return true;
	      if (this !== Writable) return false;

	      return object && object._writableState instanceof WritableState;
	    }
	  });
	} else {
	  realHasInstance = function (object) {
	    return object instanceof this;
	  };
	}

	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(186);

	  // Writable ctor is applied to Duplexes, too.
	  // `realHasInstance` is necessary because using plain `instanceof`
	  // would return false, as no `_writableState` property is attached.

	  // Trying to use the custom `instanceof` for Writable here will also break the
	  // Node.js LazyTransform implementation, which has a non-trivial getter for
	  // `_writableState` that would lead to infinite recursion.
	  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
	    return new Writable(options);
	  }

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;

	    if (typeof options.destroy === 'function') this._destroy = options.destroy;

	    if (typeof options.final === 'function') this._final = options.final;
	  }

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe, not readable'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  pna.nextTick(cb, er);
	}

	// Checks that a user-supplied chunk is valid, especially for the particular
	// mode the stream is in. Currently this means that `null` is never accepted
	// and undefined/non-string values are only allowed in object mode.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;
	  var er = false;

	  if (chunk === null) {
	    er = new TypeError('May not write null values to stream');
	  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  if (er) {
	    stream.emit('error', er);
	    pna.nextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;
	  var isBuf = !state.objectMode && _isUint8Array(chunk);

	  if (isBuf && !Buffer.isBuffer(chunk)) {
	    chunk = _uint8ArrayToBuffer(chunk);
	  }

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	  return this;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = Buffer.from(chunk, encoding);
	  }
	  return chunk;
	}

	Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
	  // making it explicit this property is not enumerable
	  // because otherwise some prototype manipulation in
	  // userland will fail
	  enumerable: false,
	  get: function () {
	    return this._writableState.highWaterMark;
	  }
	});

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
	  if (!isBuf) {
	    var newChunk = decodeChunk(state, chunk, encoding);
	    if (chunk !== newChunk) {
	      isBuf = true;
	      encoding = 'buffer';
	      chunk = newChunk;
	    }
	  }
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = {
	      chunk: chunk,
	      encoding: encoding,
	      isBuf: isBuf,
	      callback: cb,
	      next: null
	    };
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;

	  if (sync) {
	    // defer the callback if we are being called synchronously
	    // to avoid piling up things on the stack
	    pna.nextTick(cb, er);
	    // this can emit finish, and it will always happen
	    // after error
	    pna.nextTick(finishMaybe, stream, state);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	  } else {
	    // the caller expect this to happen before if
	    // it is async
	    cb(er);
	    stream._writableState.errorEmitted = true;
	    stream.emit('error', er);
	    // this can emit finish, but finish must
	    // always follow error
	    finishMaybe(stream, state);
	  }
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	      afterWrite(stream, state, finished, cb);
	    }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    var allBuffers = true;
	    while (entry) {
	      buffer[count] = entry;
	      if (!entry.isBuf) allBuffers = false;
	      entry = entry.next;
	      count += 1;
	    }
	    buffer.allBuffers = allBuffers;

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is almost always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    if (holder.next) {
	      state.corkedRequestsFree = holder.next;
	      holder.next = null;
	    } else {
	      state.corkedRequestsFree = new CorkedRequest(state);
	    }
	    state.bufferedRequestCount = 0;
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      state.bufferedRequestCount--;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('_write() is not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}
	function callFinal(stream, state) {
	  stream._final(function (err) {
	    state.pendingcb--;
	    if (err) {
	      stream.emit('error', err);
	    }
	    state.prefinished = true;
	    stream.emit('prefinish');
	    finishMaybe(stream, state);
	  });
	}
	function prefinish(stream, state) {
	  if (!state.prefinished && !state.finalCalled) {
	    if (typeof stream._final === 'function') {
	      state.pendingcb++;
	      state.finalCalled = true;
	      pna.nextTick(callFinal, stream, state);
	    } else {
	      state.prefinished = true;
	      stream.emit('prefinish');
	    }
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    prefinish(stream, state);
	    if (state.pendingcb === 0) {
	      state.finished = true;
	      stream.emit('finish');
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	function onCorkedFinish(corkReq, state, err) {
	  var entry = corkReq.entry;
	  corkReq.entry = null;
	  while (entry) {
	    var cb = entry.callback;
	    state.pendingcb--;
	    cb(err);
	    entry = entry.next;
	  }
	  if (state.corkedRequestsFree) {
	    state.corkedRequestsFree.next = corkReq;
	  } else {
	    state.corkedRequestsFree = corkReq;
	  }
	}

	Object.defineProperty(Writable.prototype, 'destroyed', {
	  get: function () {
	    if (this._writableState === undefined) {
	      return false;
	    }
	    return this._writableState.destroyed;
	  },
	  set: function (value) {
	    // we ignore the value if the stream
	    // has not been initialized yet
	    if (!this._writableState) {
	      return;
	    }

	    // backward compatibility, the user is explicitly
	    // managing destroyed
	    this._writableState.destroyed = value;
	  }
	});

	Writable.prototype.destroy = destroyImpl.destroy;
	Writable.prototype._undestroy = destroyImpl.undestroy;
	Writable.prototype._destroy = function (err, cb) {
	  this.end();
	  cb(err);
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48), __webpack_require__(68).setImmediate, (function() { return this; }())))

/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	/*<replacement>*/

	var Buffer = __webpack_require__(57).Buffer;
	/*</replacement>*/

	var isEncoding = Buffer.isEncoding || function (encoding) {
	  encoding = '' + encoding;
	  switch (encoding && encoding.toLowerCase()) {
	    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
	      return true;
	    default:
	      return false;
	  }
	};

	function _normalizeEncoding(enc) {
	  if (!enc) return 'utf8';
	  var retried;
	  while (true) {
	    switch (enc) {
	      case 'utf8':
	      case 'utf-8':
	        return 'utf8';
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return 'utf16le';
	      case 'latin1':
	      case 'binary':
	        return 'latin1';
	      case 'base64':
	      case 'ascii':
	      case 'hex':
	        return enc;
	      default:
	        if (retried) return; // undefined
	        enc = ('' + enc).toLowerCase();
	        retried = true;
	    }
	  }
	};

	// Do not cache `Buffer.isEncoding` when checking encoding names as some
	// modules monkey-patch it to support additional encodings
	function normalizeEncoding(enc) {
	  var nenc = _normalizeEncoding(enc);
	  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
	  return nenc || enc;
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters.
	exports.StringDecoder = StringDecoder;
	function StringDecoder(encoding) {
	  this.encoding = normalizeEncoding(encoding);
	  var nb;
	  switch (this.encoding) {
	    case 'utf16le':
	      this.text = utf16Text;
	      this.end = utf16End;
	      nb = 4;
	      break;
	    case 'utf8':
	      this.fillLast = utf8FillLast;
	      nb = 4;
	      break;
	    case 'base64':
	      this.text = base64Text;
	      this.end = base64End;
	      nb = 3;
	      break;
	    default:
	      this.write = simpleWrite;
	      this.end = simpleEnd;
	      return;
	  }
	  this.lastNeed = 0;
	  this.lastTotal = 0;
	  this.lastChar = Buffer.allocUnsafe(nb);
	}

	StringDecoder.prototype.write = function (buf) {
	  if (buf.length === 0) return '';
	  var r;
	  var i;
	  if (this.lastNeed) {
	    r = this.fillLast(buf);
	    if (r === undefined) return '';
	    i = this.lastNeed;
	    this.lastNeed = 0;
	  } else {
	    i = 0;
	  }
	  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
	  return r || '';
	};

	StringDecoder.prototype.end = utf8End;

	// Returns only complete characters in a Buffer
	StringDecoder.prototype.text = utf8Text;

	// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
	StringDecoder.prototype.fillLast = function (buf) {
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
	  this.lastNeed -= buf.length;
	};

	// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
	// continuation byte. If an invalid byte is detected, -2 is returned.
	function utf8CheckByte(byte) {
	  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
	  return byte >> 6 === 0x02 ? -1 : -2;
	}

	// Checks at most 3 bytes at the end of a Buffer in order to detect an
	// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
	// needed to complete the UTF-8 character (if applicable) are returned.
	function utf8CheckIncomplete(self, buf, i) {
	  var j = buf.length - 1;
	  if (j < i) return 0;
	  var nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 1;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) self.lastNeed = nb - 2;
	    return nb;
	  }
	  if (--j < i || nb === -2) return 0;
	  nb = utf8CheckByte(buf[j]);
	  if (nb >= 0) {
	    if (nb > 0) {
	      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
	    }
	    return nb;
	  }
	  return 0;
	}

	// Validates as many continuation bytes for a multi-byte UTF-8 character as
	// needed or are available. If we see a non-continuation byte where we expect
	// one, we "replace" the validated continuation bytes we've seen so far with
	// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
	// behavior. The continuation byte check is included three times in the case
	// where all of the continuation bytes for a character exist in the same buffer.
	// It is also done this way as a slight performance increase instead of using a
	// loop.
	function utf8CheckExtraBytes(self, buf, p) {
	  if ((buf[0] & 0xC0) !== 0x80) {
	    self.lastNeed = 0;
	    return '\ufffd';
	  }
	  if (self.lastNeed > 1 && buf.length > 1) {
	    if ((buf[1] & 0xC0) !== 0x80) {
	      self.lastNeed = 1;
	      return '\ufffd';
	    }
	    if (self.lastNeed > 2 && buf.length > 2) {
	      if ((buf[2] & 0xC0) !== 0x80) {
	        self.lastNeed = 2;
	        return '\ufffd';
	      }
	    }
	  }
	}

	// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
	function utf8FillLast(buf) {
	  var p = this.lastTotal - this.lastNeed;
	  var r = utf8CheckExtraBytes(this, buf, p);
	  if (r !== undefined) return r;
	  if (this.lastNeed <= buf.length) {
	    buf.copy(this.lastChar, p, 0, this.lastNeed);
	    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
	  }
	  buf.copy(this.lastChar, p, 0, buf.length);
	  this.lastNeed -= buf.length;
	}

	// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
	// partial character, the character's bytes are buffered until the required
	// number of bytes are available.
	function utf8Text(buf, i) {
	  var total = utf8CheckIncomplete(this, buf, i);
	  if (!this.lastNeed) return buf.toString('utf8', i);
	  this.lastTotal = total;
	  var end = buf.length - (total - this.lastNeed);
	  buf.copy(this.lastChar, 0, end);
	  return buf.toString('utf8', i, end);
	}

	// For UTF-8, a replacement character is added when ending on a partial
	// character.
	function utf8End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + '\ufffd';
	  return r;
	}

	// UTF-16LE typically needs two bytes per character, but even if we have an even
	// number of bytes available, we need to check if we end on a leading/high
	// surrogate. In that case, we need to wait for the next two bytes in order to
	// decode the last character properly.
	function utf16Text(buf, i) {
	  if ((buf.length - i) % 2 === 0) {
	    var r = buf.toString('utf16le', i);
	    if (r) {
	      var c = r.charCodeAt(r.length - 1);
	      if (c >= 0xD800 && c <= 0xDBFF) {
	        this.lastNeed = 2;
	        this.lastTotal = 4;
	        this.lastChar[0] = buf[buf.length - 2];
	        this.lastChar[1] = buf[buf.length - 1];
	        return r.slice(0, -1);
	      }
	    }
	    return r;
	  }
	  this.lastNeed = 1;
	  this.lastTotal = 2;
	  this.lastChar[0] = buf[buf.length - 1];
	  return buf.toString('utf16le', i, buf.length - 1);
	}

	// For UTF-16LE we do not explicitly append special replacement characters if we
	// end on a partial character, we simply let v8 handle that.
	function utf16End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) {
	    var end = this.lastTotal - this.lastNeed;
	    return r + this.lastChar.toString('utf16le', 0, end);
	  }
	  return r;
	}

	function base64Text(buf, i) {
	  var n = (buf.length - i) % 3;
	  if (n === 0) return buf.toString('base64', i);
	  this.lastNeed = 3 - n;
	  this.lastTotal = 3;
	  if (n === 1) {
	    this.lastChar[0] = buf[buf.length - 1];
	  } else {
	    this.lastChar[0] = buf[buf.length - 2];
	    this.lastChar[1] = buf[buf.length - 1];
	  }
	  return buf.toString('base64', i, buf.length - n);
	}

	function base64End(buf) {
	  var r = buf && buf.length ? this.write(buf) : '';
	  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
	  return r;
	}

	// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
	function simpleWrite(buf) {
	  return buf.toString(this.encoding);
	}

	function simpleEnd(buf) {
	  return buf && buf.length ? this.write(buf) : '';
	}

/***/ }),
/* 189 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	'use strict';

	module.exports = Transform;

	var Duplex = __webpack_require__(186);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(Transform, Duplex);

	function afterTransform(er, data) {
	  var ts = this._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb) {
	    return this.emit('error', new Error('write callback called multiple times'));
	  }

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (data != null) // single equals check for both `null` and `undefined`
	    this.push(data);

	  cb(er);

	  var rs = this._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    this._read(rs.highWaterMark);
	  }
	}

	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = {
	    afterTransform: afterTransform.bind(this),
	    needTransform: false,
	    transforming: false,
	    writecb: null,
	    writechunk: null,
	    writeencoding: null
	  };

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;

	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }

	  // When the writable side finishes, then flush out anything remaining.
	  this.on('prefinish', prefinish);
	}

	function prefinish() {
	  var _this = this;

	  if (typeof this._flush === 'function') {
	    this._flush(function (er, data) {
	      done(_this, er, data);
	    });
	  } else {
	    done(this, null, null);
	  }
	}

	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('_transform() is not implemented');
	};

	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;

	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};

	Transform.prototype._destroy = function (err, cb) {
	  var _this2 = this;

	  Duplex.prototype._destroy.call(this, err, function (err2) {
	    cb(err2);
	    _this2.emit('close');
	  });
	};

	function done(stream, er, data) {
	  if (er) return stream.emit('error', er);

	  if (data != null) // single equals check for both `null` and `undefined`
	    stream.push(data);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

	  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

	  return stream.push(null);
	}

/***/ }),
/* 190 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	'use strict';

	module.exports = PassThrough;

	var Transform = __webpack_require__(189);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

/***/ }),
/* 191 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, process) {var stream = __webpack_require__(192)
	var eos = __webpack_require__(137)
	var inherits = __webpack_require__(2)
	var shift = __webpack_require__(206)

	var SIGNAL_FLUSH = (Buffer.from && Buffer.from !== Uint8Array.from)
	  ? Buffer.from([0])
	  : new Buffer([0])

	var onuncork = function(self, fn) {
	  if (self._corked) self.once('uncork', fn)
	  else fn()
	}

	var autoDestroy = function (self, err) {
	  if (self._autoDestroy) self.destroy(err)
	}

	var destroyer = function(self, end) {
	  return function(err) {
	    if (err) autoDestroy(self, err.message === 'premature close' ? null : err)
	    else if (end && !self._ended) self.end()
	  }
	}

	var end = function(ws, fn) {
	  if (!ws) return fn()
	  if (ws._writableState && ws._writableState.finished) return fn()
	  if (ws._writableState) return ws.end(fn)
	  ws.end()
	  fn()
	}

	var toStreams2 = function(rs) {
	  return new (stream.Readable)({objectMode:true, highWaterMark:16}).wrap(rs)
	}

	var Duplexify = function(writable, readable, opts) {
	  if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts)
	  stream.Duplex.call(this, opts)

	  this._writable = null
	  this._readable = null
	  this._readable2 = null

	  this._autoDestroy = !opts || opts.autoDestroy !== false
	  this._forwardDestroy = !opts || opts.destroy !== false
	  this._forwardEnd = !opts || opts.end !== false
	  this._corked = 1 // start corked
	  this._ondrain = null
	  this._drained = false
	  this._forwarding = false
	  this._unwrite = null
	  this._unread = null
	  this._ended = false

	  this.destroyed = false

	  if (writable) this.setWritable(writable)
	  if (readable) this.setReadable(readable)
	}

	inherits(Duplexify, stream.Duplex)

	Duplexify.obj = function(writable, readable, opts) {
	  if (!opts) opts = {}
	  opts.objectMode = true
	  opts.highWaterMark = 16
	  return new Duplexify(writable, readable, opts)
	}

	Duplexify.prototype.cork = function() {
	  if (++this._corked === 1) this.emit('cork')
	}

	Duplexify.prototype.uncork = function() {
	  if (this._corked && --this._corked === 0) this.emit('uncork')
	}

	Duplexify.prototype.setWritable = function(writable) {
	  if (this._unwrite) this._unwrite()

	  if (this.destroyed) {
	    if (writable && writable.destroy) writable.destroy()
	    return
	  }

	  if (writable === null || writable === false) {
	    this.end()
	    return
	  }

	  var self = this
	  var unend = eos(writable, {writable:true, readable:false}, destroyer(this, this._forwardEnd))

	  var ondrain = function() {
	    var ondrain = self._ondrain
	    self._ondrain = null
	    if (ondrain) ondrain()
	  }

	  var clear = function() {
	    self._writable.removeListener('drain', ondrain)
	    unend()
	  }

	  if (this._unwrite) process.nextTick(ondrain) // force a drain on stream reset to avoid livelocks

	  this._writable = writable
	  this._writable.on('drain', ondrain)
	  this._unwrite = clear

	  this.uncork() // always uncork setWritable
	}

	Duplexify.prototype.setReadable = function(readable) {
	  if (this._unread) this._unread()

	  if (this.destroyed) {
	    if (readable && readable.destroy) readable.destroy()
	    return
	  }

	  if (readable === null || readable === false) {
	    this.push(null)
	    this.resume()
	    return
	  }

	  var self = this
	  var unend = eos(readable, {writable:false, readable:true}, destroyer(this))

	  var onreadable = function() {
	    self._forward()
	  }

	  var onend = function() {
	    self.push(null)
	  }

	  var clear = function() {
	    self._readable2.removeListener('readable', onreadable)
	    self._readable2.removeListener('end', onend)
	    unend()
	  }

	  this._drained = true
	  this._readable = readable
	  this._readable2 = readable._readableState ? readable : toStreams2(readable)
	  this._readable2.on('readable', onreadable)
	  this._readable2.on('end', onend)
	  this._unread = clear

	  this._forward()
	}

	Duplexify.prototype._read = function() {
	  this._drained = true
	  this._forward()
	}

	Duplexify.prototype._forward = function() {
	  if (this._forwarding || !this._readable2 || !this._drained) return
	  this._forwarding = true

	  var data

	  while (this._drained && (data = shift(this._readable2)) !== null) {
	    if (this.destroyed) continue
	    this._drained = this.push(data)
	  }

	  this._forwarding = false
	}

	Duplexify.prototype.destroy = function(err) {
	  if (this.destroyed) return
	  this.destroyed = true

	  var self = this
	  process.nextTick(function() {
	    self._destroy(err)
	  })
	}

	Duplexify.prototype._destroy = function(err) {
	  if (err) {
	    var ondrain = this._ondrain
	    this._ondrain = null
	    if (ondrain) ondrain(err)
	    else this.emit('error', err)
	  }

	  if (this._forwardDestroy) {
	    if (this._readable && this._readable.destroy) this._readable.destroy()
	    if (this._writable && this._writable.destroy) this._writable.destroy()
	  }

	  this.emit('close')
	}

	Duplexify.prototype._write = function(data, enc, cb) {
	  if (this.destroyed) return cb()
	  if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb))
	  if (data === SIGNAL_FLUSH) return this._finish(cb)
	  if (!this._writable) return cb()

	  if (this._writable.write(data) === false) this._ondrain = cb
	  else cb()
	}


	Duplexify.prototype._finish = function(cb) {
	  var self = this
	  this.emit('preend')
	  onuncork(this, function() {
	    end(self._forwardEnd && self._writable, function() {
	      // haxx to not emit prefinish twice
	      if (self._writableState.prefinished === false) self._writableState.prefinished = true
	      self.emit('prefinish')
	      onuncork(self, cb)
	    })
	  })
	}

	Duplexify.prototype.end = function(data, enc, cb) {
	  if (typeof data === 'function') return this.end(null, null, data)
	  if (typeof enc === 'function') return this.end(data, null, enc)
	  this._ended = true
	  if (data) this.write(data)
	  if (!this._writableState.ending) this.write(SIGNAL_FLUSH)
	  return stream.Writable.prototype.end.call(this, cb)
	}

	module.exports = Duplexify

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(58).Buffer, __webpack_require__(48)))

/***/ }),
/* 192 */
/***/ (function(module, exports, __webpack_require__) {

	var Stream = (function (){
	  try {
	    return __webpack_require__(193); // hack to fix a circular dependency issue when used with browserify
	  } catch(_){}
	}());
	exports = module.exports = __webpack_require__(198);
	exports.Stream = Stream || exports;
	exports.Readable = exports;
	exports.Writable = __webpack_require__(195);
	exports.Duplex = __webpack_require__(197);
	exports.Transform = __webpack_require__(203);
	exports.PassThrough = __webpack_require__(205);


/***/ }),
/* 193 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	module.exports = Stream;

	var EE = __webpack_require__(3).EventEmitter;
	var inherits = __webpack_require__(2);

	inherits(Stream, EE);
	Stream.Readable = __webpack_require__(192);
	Stream.Writable = __webpack_require__(194);
	Stream.Duplex = __webpack_require__(201);
	Stream.Transform = __webpack_require__(202);
	Stream.PassThrough = __webpack_require__(204);

	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;



	// old-style streams.  Note that the pipe method (the only relevant
	// part of this class) is overridden in the Readable class.

	function Stream() {
	  EE.call(this);
	}

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
	    if (dest.writable) {
	      if (false === dest.write(chunk) && source.pause) {
	        source.pause();
	      }
	    }
	  }

	  source.on('data', ondata);

	  function ondrain() {
	    if (source.readable && source.resume) {
	      source.resume();
	    }
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
	    source.on('end', onend);
	    source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    dest.end();
	  }


	  function onclose() {
	    if (didOnEnd) return;
	    didOnEnd = true;

	    if (typeof dest.destroy === 'function') dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
	    cleanup();
	    if (EE.listenerCount(this, 'error') === 0) {
	      throw er; // Unhandled stream error in pipe.
	    }
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
	    source.removeListener('data', ondata);
	    dest.removeListener('drain', ondrain);

	    source.removeListener('end', onend);
	    source.removeListener('close', onclose);

	    source.removeListener('error', onerror);
	    dest.removeListener('error', onerror);

	    source.removeListener('end', cleanup);
	    source.removeListener('close', cleanup);

	    dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};


/***/ }),
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(195)


/***/ }),
/* 195 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process, setImmediate) {// A bit simpler than readable streams.
	// Implement an async ._write(chunk, encoding, cb), and it'll handle all
	// the drain event emission and buffering.

	'use strict';

	module.exports = Writable;

	/*<replacement>*/
	var processNextTick = __webpack_require__(196);
	/*</replacement>*/

	/*<replacement>*/
	var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
	/*</replacement>*/

	/*<replacement>*/
	var Buffer = __webpack_require__(58).Buffer;
	/*</replacement>*/

	Writable.WritableState = WritableState;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var internalUtil = {
	  deprecate: __webpack_require__(71)
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream;
	(function () {
	  try {
	    Stream = __webpack_require__(193);
	  } catch (_) {} finally {
	    if (!Stream) Stream = __webpack_require__(3).EventEmitter;
	  }
	})();
	/*</replacement>*/

	var Buffer = __webpack_require__(58).Buffer;

	util.inherits(Writable, Stream);

	function nop() {}

	function WriteReq(chunk, encoding, cb) {
	  this.chunk = chunk;
	  this.encoding = encoding;
	  this.callback = cb;
	  this.next = null;
	}

	var Duplex;
	function WritableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(197);

	  options = options || {};

	  // object stream flag to indicate whether or not this stream
	  // contains buffers or objects.
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

	  // the point at which write() starts returning false
	  // Note: 0 is a valid value, means that we always return false if
	  // the entire buffer is not flushed immediately on write()
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~ ~this.highWaterMark;

	  this.needDrain = false;
	  // at the start of calling end()
	  this.ending = false;
	  // when end() has been called, and returned
	  this.ended = false;
	  // when 'finish' is emitted
	  this.finished = false;

	  // should we decode strings into buffers before passing to _write?
	  // this is here so that some node-core streams can optimize string
	  // handling at a lower level.
	  var noDecode = options.decodeStrings === false;
	  this.decodeStrings = !noDecode;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // not an actual buffer we keep track of, but a measurement
	  // of how much we're waiting to get pushed to some underlying
	  // socket or file.
	  this.length = 0;

	  // a flag to see when we're in the middle of a write.
	  this.writing = false;

	  // when true all writes will be buffered until .uncork() call
	  this.corked = 0;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // a flag to know if we're processing previously buffered items, which
	  // may call the _write() callback in the same tick, so that we don't
	  // end up in an overlapped onwrite situation.
	  this.bufferProcessing = false;

	  // the callback that's passed to _write(chunk,cb)
	  this.onwrite = function (er) {
	    onwrite(stream, er);
	  };

	  // the callback that the user supplies to write(chunk,encoding,cb)
	  this.writecb = null;

	  // the amount that is being written when _write is called.
	  this.writelen = 0;

	  this.bufferedRequest = null;
	  this.lastBufferedRequest = null;

	  // number of pending user-supplied write callbacks
	  // this must be 0 before 'finish' can be emitted
	  this.pendingcb = 0;

	  // emit prefinish if the only thing we're waiting for is _write cbs
	  // This is relevant for synchronous Transform streams
	  this.prefinished = false;

	  // True if the error was already emitted and should not be thrown again
	  this.errorEmitted = false;

	  // count buffered requests
	  this.bufferedRequestCount = 0;

	  // create the two objects needed to store the corked requests
	  // they are not a linked list, as no new elements are inserted in there
	  this.corkedRequestsFree = new CorkedRequest(this);
	  this.corkedRequestsFree.next = new CorkedRequest(this);
	}

	WritableState.prototype.getBuffer = function writableStateGetBuffer() {
	  var current = this.bufferedRequest;
	  var out = [];
	  while (current) {
	    out.push(current);
	    current = current.next;
	  }
	  return out;
	};

	(function () {
	  try {
	    Object.defineProperty(WritableState.prototype, 'buffer', {
	      get: internalUtil.deprecate(function () {
	        return this.getBuffer();
	      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
	    });
	  } catch (_) {}
	})();

	var Duplex;
	function Writable(options) {
	  Duplex = Duplex || __webpack_require__(197);

	  // Writable ctor is applied to Duplexes, though they're not
	  // instanceof Writable, they're instanceof Readable.
	  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

	  this._writableState = new WritableState(options, this);

	  // legacy.
	  this.writable = true;

	  if (options) {
	    if (typeof options.write === 'function') this._write = options.write;

	    if (typeof options.writev === 'function') this._writev = options.writev;
	  }

	  Stream.call(this);
	}

	// Otherwise people can pipe Writable streams, which is just wrong.
	Writable.prototype.pipe = function () {
	  this.emit('error', new Error('Cannot pipe. Not readable.'));
	};

	function writeAfterEnd(stream, cb) {
	  var er = new Error('write after end');
	  // TODO: defer error events consistently everywhere, not just the cb
	  stream.emit('error', er);
	  processNextTick(cb, er);
	}

	// If we get something that is not a buffer, string, null, or undefined,
	// and we're not in objectMode, then that's an error.
	// Otherwise stream chunks are all considered to be of length=1, and the
	// watermarks determine how many objects to keep in the buffer, rather than
	// how many bytes or characters.
	function validChunk(stream, state, chunk, cb) {
	  var valid = true;

	  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
	    var er = new TypeError('Invalid non-string/buffer chunk');
	    stream.emit('error', er);
	    processNextTick(cb, er);
	    valid = false;
	  }
	  return valid;
	}

	Writable.prototype.write = function (chunk, encoding, cb) {
	  var state = this._writableState;
	  var ret = false;

	  if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

	  if (typeof cb !== 'function') cb = nop;

	  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
	    state.pendingcb++;
	    ret = writeOrBuffer(this, state, chunk, encoding, cb);
	  }

	  return ret;
	};

	Writable.prototype.cork = function () {
	  var state = this._writableState;

	  state.corked++;
	};

	Writable.prototype.uncork = function () {
	  var state = this._writableState;

	  if (state.corked) {
	    state.corked--;

	    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
	  }
	};

	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
	  // node::ParseEncoding() requires lower case.
	  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
	  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
	  this._writableState.defaultEncoding = encoding;
	};

	function decodeChunk(state, chunk, encoding) {
	  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
	    chunk = new Buffer(chunk, encoding);
	  }
	  return chunk;
	}

	// if we're already writing something, then just put this
	// in the queue, and wait our turn.  Otherwise, call _write
	// If we return false, then we need a drain event, so set that flag.
	function writeOrBuffer(stream, state, chunk, encoding, cb) {
	  chunk = decodeChunk(state, chunk, encoding);

	  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
	  var len = state.objectMode ? 1 : chunk.length;

	  state.length += len;

	  var ret = state.length < state.highWaterMark;
	  // we must ensure that previous needDrain will not be reset to false.
	  if (!ret) state.needDrain = true;

	  if (state.writing || state.corked) {
	    var last = state.lastBufferedRequest;
	    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
	    if (last) {
	      last.next = state.lastBufferedRequest;
	    } else {
	      state.bufferedRequest = state.lastBufferedRequest;
	    }
	    state.bufferedRequestCount += 1;
	  } else {
	    doWrite(stream, state, false, len, chunk, encoding, cb);
	  }

	  return ret;
	}

	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
	  state.writelen = len;
	  state.writecb = cb;
	  state.writing = true;
	  state.sync = true;
	  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
	  state.sync = false;
	}

	function onwriteError(stream, state, sync, er, cb) {
	  --state.pendingcb;
	  if (sync) processNextTick(cb, er);else cb(er);

	  stream._writableState.errorEmitted = true;
	  stream.emit('error', er);
	}

	function onwriteStateUpdate(state) {
	  state.writing = false;
	  state.writecb = null;
	  state.length -= state.writelen;
	  state.writelen = 0;
	}

	function onwrite(stream, er) {
	  var state = stream._writableState;
	  var sync = state.sync;
	  var cb = state.writecb;

	  onwriteStateUpdate(state);

	  if (er) onwriteError(stream, state, sync, er, cb);else {
	    // Check if we're actually ready to finish, but don't emit yet
	    var finished = needFinish(state);

	    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
	      clearBuffer(stream, state);
	    }

	    if (sync) {
	      /*<replacement>*/
	      asyncWrite(afterWrite, stream, state, finished, cb);
	      /*</replacement>*/
	    } else {
	        afterWrite(stream, state, finished, cb);
	      }
	  }
	}

	function afterWrite(stream, state, finished, cb) {
	  if (!finished) onwriteDrain(stream, state);
	  state.pendingcb--;
	  cb();
	  finishMaybe(stream, state);
	}

	// Must force callback to be called on nextTick, so that we don't
	// emit 'drain' before the write() consumer gets the 'false' return
	// value, and has a chance to attach a 'drain' listener.
	function onwriteDrain(stream, state) {
	  if (state.length === 0 && state.needDrain) {
	    state.needDrain = false;
	    stream.emit('drain');
	  }
	}

	// if there's something in the buffer waiting, then process it
	function clearBuffer(stream, state) {
	  state.bufferProcessing = true;
	  var entry = state.bufferedRequest;

	  if (stream._writev && entry && entry.next) {
	    // Fast case, write everything using _writev()
	    var l = state.bufferedRequestCount;
	    var buffer = new Array(l);
	    var holder = state.corkedRequestsFree;
	    holder.entry = entry;

	    var count = 0;
	    while (entry) {
	      buffer[count] = entry;
	      entry = entry.next;
	      count += 1;
	    }

	    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

	    // doWrite is always async, defer these to save a bit of time
	    // as the hot path ends with doWrite
	    state.pendingcb++;
	    state.lastBufferedRequest = null;
	    state.corkedRequestsFree = holder.next;
	    holder.next = null;
	  } else {
	    // Slow case, write chunks one-by-one
	    while (entry) {
	      var chunk = entry.chunk;
	      var encoding = entry.encoding;
	      var cb = entry.callback;
	      var len = state.objectMode ? 1 : chunk.length;

	      doWrite(stream, state, false, len, chunk, encoding, cb);
	      entry = entry.next;
	      // if we didn't call the onwrite immediately, then
	      // it means that we need to wait until it does.
	      // also, that means that the chunk and cb are currently
	      // being processed, so move the buffer counter past them.
	      if (state.writing) {
	        break;
	      }
	    }

	    if (entry === null) state.lastBufferedRequest = null;
	  }

	  state.bufferedRequestCount = 0;
	  state.bufferedRequest = entry;
	  state.bufferProcessing = false;
	}

	Writable.prototype._write = function (chunk, encoding, cb) {
	  cb(new Error('not implemented'));
	};

	Writable.prototype._writev = null;

	Writable.prototype.end = function (chunk, encoding, cb) {
	  var state = this._writableState;

	  if (typeof chunk === 'function') {
	    cb = chunk;
	    chunk = null;
	    encoding = null;
	  } else if (typeof encoding === 'function') {
	    cb = encoding;
	    encoding = null;
	  }

	  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

	  // .end() fully uncorks
	  if (state.corked) {
	    state.corked = 1;
	    this.uncork();
	  }

	  // ignore unnecessary end() calls.
	  if (!state.ending && !state.finished) endWritable(this, state, cb);
	};

	function needFinish(state) {
	  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}

	function prefinish(stream, state) {
	  if (!state.prefinished) {
	    state.prefinished = true;
	    stream.emit('prefinish');
	  }
	}

	function finishMaybe(stream, state) {
	  var need = needFinish(state);
	  if (need) {
	    if (state.pendingcb === 0) {
	      prefinish(stream, state);
	      state.finished = true;
	      stream.emit('finish');
	    } else {
	      prefinish(stream, state);
	    }
	  }
	  return need;
	}

	function endWritable(stream, state, cb) {
	  state.ending = true;
	  finishMaybe(stream, state);
	  if (cb) {
	    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
	  }
	  state.ended = true;
	  stream.writable = false;
	}

	// It seems a linked list but it is not
	// there will be only 2 of these for each stream
	function CorkedRequest(state) {
	  var _this = this;

	  this.next = null;
	  this.entry = null;

	  this.finish = function (err) {
	    var entry = _this.entry;
	    _this.entry = null;
	    while (entry) {
	      var cb = entry.callback;
	      state.pendingcb--;
	      cb(err);
	      entry = entry.next;
	    }
	    if (state.corkedRequestsFree) {
	      state.corkedRequestsFree.next = _this;
	    } else {
	      state.corkedRequestsFree = _this;
	    }
	  };
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48), __webpack_require__(68).setImmediate))

/***/ }),
/* 196 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	if (!process.version ||
	    process.version.indexOf('v0.') === 0 ||
	    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
	  module.exports = nextTick;
	} else {
	  module.exports = process.nextTick;
	}

	function nextTick(fn, arg1, arg2, arg3) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('"callback" argument must be a function');
	  }
	  var len = arguments.length;
	  var args, i;
	  switch (len) {
	  case 0:
	  case 1:
	    return process.nextTick(fn);
	  case 2:
	    return process.nextTick(function afterTickOne() {
	      fn.call(null, arg1);
	    });
	  case 3:
	    return process.nextTick(function afterTickTwo() {
	      fn.call(null, arg1, arg2);
	    });
	  case 4:
	    return process.nextTick(function afterTickThree() {
	      fn.call(null, arg1, arg2, arg3);
	    });
	  default:
	    args = new Array(len - 1);
	    i = 0;
	    while (i < args.length) {
	      args[i++] = arguments[i];
	    }
	    return process.nextTick(function afterTick() {
	      fn.apply(null, args);
	    });
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 197 */
/***/ (function(module, exports, __webpack_require__) {

	// a duplex stream is just a stream that is both readable and writable.
	// Since JS doesn't have multiple prototypal inheritance, this class
	// prototypally inherits from Readable, and then parasitically from
	// Writable.

	'use strict';

	/*<replacement>*/

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    keys.push(key);
	  }return keys;
	};
	/*</replacement>*/

	module.exports = Duplex;

	/*<replacement>*/
	var processNextTick = __webpack_require__(196);
	/*</replacement>*/

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	var Readable = __webpack_require__(198);
	var Writable = __webpack_require__(195);

	util.inherits(Duplex, Readable);

	var keys = objectKeys(Writable.prototype);
	for (var v = 0; v < keys.length; v++) {
	  var method = keys[v];
	  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	}

	function Duplex(options) {
	  if (!(this instanceof Duplex)) return new Duplex(options);

	  Readable.call(this, options);
	  Writable.call(this, options);

	  if (options && options.readable === false) this.readable = false;

	  if (options && options.writable === false) this.writable = false;

	  this.allowHalfOpen = true;
	  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

	  this.once('end', onend);
	}

	// the no-half-open enforcer
	function onend() {
	  // if we allow half-open state, or if the writable side ended,
	  // then we're ok.
	  if (this.allowHalfOpen || this._writableState.ended) return;

	  // no more data can be written.
	  // But allow more writes to happen in this tick.
	  processNextTick(onEndNT, this);
	}

	function onEndNT(self) {
	  self.end();
	}

	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

/***/ }),
/* 198 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';

	module.exports = Readable;

	/*<replacement>*/
	var processNextTick = __webpack_require__(196);
	/*</replacement>*/

	/*<replacement>*/
	var isArray = __webpack_require__(55);
	/*</replacement>*/

	/*<replacement>*/
	var Buffer = __webpack_require__(58).Buffer;
	/*</replacement>*/

	Readable.ReadableState = ReadableState;

	var EE = __webpack_require__(3);

	/*<replacement>*/
	var EElistenerCount = function (emitter, type) {
	  return emitter.listeners(type).length;
	};
	/*</replacement>*/

	/*<replacement>*/
	var Stream;
	(function () {
	  try {
	    Stream = __webpack_require__(193);
	  } catch (_) {} finally {
	    if (!Stream) Stream = __webpack_require__(3).EventEmitter;
	  }
	})();
	/*</replacement>*/

	var Buffer = __webpack_require__(58).Buffer;

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	/*<replacement>*/
	var debugUtil = __webpack_require__(199);
	var debug = undefined;
	if (debugUtil && debugUtil.debuglog) {
	  debug = debugUtil.debuglog('stream');
	} else {
	  debug = function () {};
	}
	/*</replacement>*/

	var StringDecoder;

	util.inherits(Readable, Stream);

	var Duplex;
	function ReadableState(options, stream) {
	  Duplex = Duplex || __webpack_require__(197);

	  options = options || {};

	  // object stream flag. Used to make read(n) ignore n and to
	  // make all the buffer merging and length checks go away
	  this.objectMode = !!options.objectMode;

	  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

	  // the point at which it stops calling _read() to fill the buffer
	  // Note: 0 is a valid value, means "don't call _read preemptively ever"
	  var hwm = options.highWaterMark;
	  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
	  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

	  // cast to ints.
	  this.highWaterMark = ~ ~this.highWaterMark;

	  this.buffer = [];
	  this.length = 0;
	  this.pipes = null;
	  this.pipesCount = 0;
	  this.flowing = null;
	  this.ended = false;
	  this.endEmitted = false;
	  this.reading = false;

	  // a flag to be able to tell if the onwrite cb is called immediately,
	  // or on a later tick.  We set this to true at first, because any
	  // actions that shouldn't happen until "later" should generally also
	  // not happen before the first write call.
	  this.sync = true;

	  // whenever we return null, then we set a flag to say
	  // that we're awaiting a 'readable' event emission.
	  this.needReadable = false;
	  this.emittedReadable = false;
	  this.readableListening = false;
	  this.resumeScheduled = false;

	  // Crypto is kind of old and crusty.  Historically, its default string
	  // encoding is 'binary' so we have to make this configurable.
	  // Everything else in the universe uses 'utf8', though.
	  this.defaultEncoding = options.defaultEncoding || 'utf8';

	  // when piping, we only care about 'readable' events that happen
	  // after read()ing all the bytes and not getting any pushback.
	  this.ranOut = false;

	  // the number of writers that are awaiting a drain event in .pipe()s
	  this.awaitDrain = 0;

	  // if true, a maybeReadMore has been scheduled
	  this.readingMore = false;

	  this.decoder = null;
	  this.encoding = null;
	  if (options.encoding) {
	    if (!StringDecoder) StringDecoder = __webpack_require__(200).StringDecoder;
	    this.decoder = new StringDecoder(options.encoding);
	    this.encoding = options.encoding;
	  }
	}

	var Duplex;
	function Readable(options) {
	  Duplex = Duplex || __webpack_require__(197);

	  if (!(this instanceof Readable)) return new Readable(options);

	  this._readableState = new ReadableState(options, this);

	  // legacy
	  this.readable = true;

	  if (options && typeof options.read === 'function') this._read = options.read;

	  Stream.call(this);
	}

	// Manually shove something into the read() buffer.
	// This returns true if the highWaterMark has not been hit yet,
	// similar to how Writable.write() returns true if you should
	// write() some more.
	Readable.prototype.push = function (chunk, encoding) {
	  var state = this._readableState;

	  if (!state.objectMode && typeof chunk === 'string') {
	    encoding = encoding || state.defaultEncoding;
	    if (encoding !== state.encoding) {
	      chunk = new Buffer(chunk, encoding);
	      encoding = '';
	    }
	  }

	  return readableAddChunk(this, state, chunk, encoding, false);
	};

	// Unshift should *always* be something directly out of read()
	Readable.prototype.unshift = function (chunk) {
	  var state = this._readableState;
	  return readableAddChunk(this, state, chunk, '', true);
	};

	Readable.prototype.isPaused = function () {
	  return this._readableState.flowing === false;
	};

	function readableAddChunk(stream, state, chunk, encoding, addToFront) {
	  var er = chunkInvalid(state, chunk);
	  if (er) {
	    stream.emit('error', er);
	  } else if (chunk === null) {
	    state.reading = false;
	    onEofChunk(stream, state);
	  } else if (state.objectMode || chunk && chunk.length > 0) {
	    if (state.ended && !addToFront) {
	      var e = new Error('stream.push() after EOF');
	      stream.emit('error', e);
	    } else if (state.endEmitted && addToFront) {
	      var e = new Error('stream.unshift() after end event');
	      stream.emit('error', e);
	    } else {
	      var skipAdd;
	      if (state.decoder && !addToFront && !encoding) {
	        chunk = state.decoder.write(chunk);
	        skipAdd = !state.objectMode && chunk.length === 0;
	      }

	      if (!addToFront) state.reading = false;

	      // Don't add to the buffer if we've decoded to an empty string chunk and
	      // we're not in object mode
	      if (!skipAdd) {
	        // if we want the data now, just emit it.
	        if (state.flowing && state.length === 0 && !state.sync) {
	          stream.emit('data', chunk);
	          stream.read(0);
	        } else {
	          // update the buffer info.
	          state.length += state.objectMode ? 1 : chunk.length;
	          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

	          if (state.needReadable) emitReadable(stream);
	        }
	      }

	      maybeReadMore(stream, state);
	    }
	  } else if (!addToFront) {
	    state.reading = false;
	  }

	  return needMoreData(state);
	}

	// if it's past the high water mark, we can push in some more.
	// Also, if we have no data yet, we can stand some
	// more bytes.  This is to work around cases where hwm=0,
	// such as the repl.  Also, if the push() triggered a
	// readable event, and the user called read(largeNumber) such that
	// needReadable was set, then we ought to push more, so that another
	// 'readable' event will be triggered.
	function needMoreData(state) {
	  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}

	// backwards compatibility.
	Readable.prototype.setEncoding = function (enc) {
	  if (!StringDecoder) StringDecoder = __webpack_require__(200).StringDecoder;
	  this._readableState.decoder = new StringDecoder(enc);
	  this._readableState.encoding = enc;
	  return this;
	};

	// Don't raise the hwm > 8MB
	var MAX_HWM = 0x800000;
	function computeNewHighWaterMark(n) {
	  if (n >= MAX_HWM) {
	    n = MAX_HWM;
	  } else {
	    // Get the next highest power of 2
	    n--;
	    n |= n >>> 1;
	    n |= n >>> 2;
	    n |= n >>> 4;
	    n |= n >>> 8;
	    n |= n >>> 16;
	    n++;
	  }
	  return n;
	}

	function howMuchToRead(n, state) {
	  if (state.length === 0 && state.ended) return 0;

	  if (state.objectMode) return n === 0 ? 0 : 1;

	  if (n === null || isNaN(n)) {
	    // only flow one buffer at a time
	    if (state.flowing && state.buffer.length) return state.buffer[0].length;else return state.length;
	  }

	  if (n <= 0) return 0;

	  // If we're asking for more than the target buffer level,
	  // then raise the water mark.  Bump up to the next highest
	  // power of 2, to prevent increasing it excessively in tiny
	  // amounts.
	  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);

	  // don't have that much.  return null, unless we've ended.
	  if (n > state.length) {
	    if (!state.ended) {
	      state.needReadable = true;
	      return 0;
	    } else {
	      return state.length;
	    }
	  }

	  return n;
	}

	// you can override either this method, or the async _read(n) below.
	Readable.prototype.read = function (n) {
	  debug('read', n);
	  var state = this._readableState;
	  var nOrig = n;

	  if (typeof n !== 'number' || n > 0) state.emittedReadable = false;

	  // if we're doing read(0) to trigger a readable event, but we
	  // already have a bunch of data in the buffer, then just trigger
	  // the 'readable' event and move on.
	  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
	    debug('read: emitReadable', state.length, state.ended);
	    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
	    return null;
	  }

	  n = howMuchToRead(n, state);

	  // if we've ended, and we're now clear, then finish it up.
	  if (n === 0 && state.ended) {
	    if (state.length === 0) endReadable(this);
	    return null;
	  }

	  // All the actual chunk generation logic needs to be
	  // *below* the call to _read.  The reason is that in certain
	  // synthetic stream cases, such as passthrough streams, _read
	  // may be a completely synchronous operation which may change
	  // the state of the read buffer, providing enough data when
	  // before there was *not* enough.
	  //
	  // So, the steps are:
	  // 1. Figure out what the state of things will be after we do
	  // a read from the buffer.
	  //
	  // 2. If that resulting state will trigger a _read, then call _read.
	  // Note that this may be asynchronous, or synchronous.  Yes, it is
	  // deeply ugly to write APIs this way, but that still doesn't mean
	  // that the Readable class should behave improperly, as streams are
	  // designed to be sync/async agnostic.
	  // Take note if the _read call is sync or async (ie, if the read call
	  // has returned yet), so that we know whether or not it's safe to emit
	  // 'readable' etc.
	  //
	  // 3. Actually pull the requested chunks out of the buffer and return.

	  // if we need a readable event, then we need to do some reading.
	  var doRead = state.needReadable;
	  debug('need readable', doRead);

	  // if we currently have less than the highWaterMark, then also read some
	  if (state.length === 0 || state.length - n < state.highWaterMark) {
	    doRead = true;
	    debug('length less than watermark', doRead);
	  }

	  // however, if we've ended, then there's no point, and if we're already
	  // reading, then it's unnecessary.
	  if (state.ended || state.reading) {
	    doRead = false;
	    debug('reading or ended', doRead);
	  }

	  if (doRead) {
	    debug('do read');
	    state.reading = true;
	    state.sync = true;
	    // if the length is currently zero, then we *need* a readable event.
	    if (state.length === 0) state.needReadable = true;
	    // call internal read method
	    this._read(state.highWaterMark);
	    state.sync = false;
	  }

	  // If _read pushed data synchronously, then `reading` will be false,
	  // and we need to re-evaluate how much data we can return to the user.
	  if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

	  var ret;
	  if (n > 0) ret = fromList(n, state);else ret = null;

	  if (ret === null) {
	    state.needReadable = true;
	    n = 0;
	  }

	  state.length -= n;

	  // If we have nothing in the buffer, then we want to know
	  // as soon as we *do* get something into the buffer.
	  if (state.length === 0 && !state.ended) state.needReadable = true;

	  // If we tried to read() past the EOF, then emit end on the next tick.
	  if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

	  if (ret !== null) this.emit('data', ret);

	  return ret;
	};

	function chunkInvalid(state, chunk) {
	  var er = null;
	  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
	    er = new TypeError('Invalid non-string/buffer chunk');
	  }
	  return er;
	}

	function onEofChunk(stream, state) {
	  if (state.ended) return;
	  if (state.decoder) {
	    var chunk = state.decoder.end();
	    if (chunk && chunk.length) {
	      state.buffer.push(chunk);
	      state.length += state.objectMode ? 1 : chunk.length;
	    }
	  }
	  state.ended = true;

	  // emit 'readable' now to make sure it gets picked up.
	  emitReadable(stream);
	}

	// Don't emit readable right away in sync mode, because this can trigger
	// another read() call => stack overflow.  This way, it might trigger
	// a nextTick recursion warning, but that's not so bad.
	function emitReadable(stream) {
	  var state = stream._readableState;
	  state.needReadable = false;
	  if (!state.emittedReadable) {
	    debug('emitReadable', state.flowing);
	    state.emittedReadable = true;
	    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
	  }
	}

	function emitReadable_(stream) {
	  debug('emit readable');
	  stream.emit('readable');
	  flow(stream);
	}

	// at this point, the user has presumably seen the 'readable' event,
	// and called read() to consume some data.  that may have triggered
	// in turn another _read(n) call, in which case reading = true if
	// it's in progress.
	// However, if we're not ended, or reading, and the length < hwm,
	// then go ahead and try to read some more preemptively.
	function maybeReadMore(stream, state) {
	  if (!state.readingMore) {
	    state.readingMore = true;
	    processNextTick(maybeReadMore_, stream, state);
	  }
	}

	function maybeReadMore_(stream, state) {
	  var len = state.length;
	  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
	    debug('maybeReadMore read 0');
	    stream.read(0);
	    if (len === state.length)
	      // didn't get any data, stop spinning.
	      break;else len = state.length;
	  }
	  state.readingMore = false;
	}

	// abstract method.  to be overridden in specific implementation classes.
	// call cb(er, data) where data is <= n in length.
	// for virtual (non-string, non-buffer) streams, "length" is somewhat
	// arbitrary, and perhaps not very meaningful.
	Readable.prototype._read = function (n) {
	  this.emit('error', new Error('not implemented'));
	};

	Readable.prototype.pipe = function (dest, pipeOpts) {
	  var src = this;
	  var state = this._readableState;

	  switch (state.pipesCount) {
	    case 0:
	      state.pipes = dest;
	      break;
	    case 1:
	      state.pipes = [state.pipes, dest];
	      break;
	    default:
	      state.pipes.push(dest);
	      break;
	  }
	  state.pipesCount += 1;
	  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

	  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

	  var endFn = doEnd ? onend : cleanup;
	  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

	  dest.on('unpipe', onunpipe);
	  function onunpipe(readable) {
	    debug('onunpipe');
	    if (readable === src) {
	      cleanup();
	    }
	  }

	  function onend() {
	    debug('onend');
	    dest.end();
	  }

	  // when the dest drains, it reduces the awaitDrain counter
	  // on the source.  This would be more elegant with a .once()
	  // handler in flow(), but adding and removing repeatedly is
	  // too slow.
	  var ondrain = pipeOnDrain(src);
	  dest.on('drain', ondrain);

	  var cleanedUp = false;
	  function cleanup() {
	    debug('cleanup');
	    // cleanup event handlers once the pipe is broken
	    dest.removeListener('close', onclose);
	    dest.removeListener('finish', onfinish);
	    dest.removeListener('drain', ondrain);
	    dest.removeListener('error', onerror);
	    dest.removeListener('unpipe', onunpipe);
	    src.removeListener('end', onend);
	    src.removeListener('end', cleanup);
	    src.removeListener('data', ondata);

	    cleanedUp = true;

	    // if the reader is waiting for a drain event from this
	    // specific writer, then it would cause it to never start
	    // flowing again.
	    // So, if this is awaiting a drain, then we just call it now.
	    // If we don't know, then assume that we are waiting for one.
	    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
	  }

	  src.on('data', ondata);
	  function ondata(chunk) {
	    debug('ondata');
	    var ret = dest.write(chunk);
	    if (false === ret) {
	      // If the user unpiped during `dest.write()`, it is possible
	      // to get stuck in a permanently paused state if that write
	      // also returned false.
	      if (state.pipesCount === 1 && state.pipes[0] === dest && src.listenerCount('data') === 1 && !cleanedUp) {
	        debug('false write response, pause', src._readableState.awaitDrain);
	        src._readableState.awaitDrain++;
	      }
	      src.pause();
	    }
	  }

	  // if the dest has an error, then stop piping into it.
	  // however, don't suppress the throwing behavior for this.
	  function onerror(er) {
	    debug('onerror', er);
	    unpipe();
	    dest.removeListener('error', onerror);
	    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
	  }
	  // This is a brutally ugly hack to make sure that our error handler
	  // is attached before any userland ones.  NEVER DO THIS.
	  if (!dest._events || !dest._events.error) dest.on('error', onerror);else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);else dest._events.error = [onerror, dest._events.error];

	  // Both close and finish should trigger unpipe, but only once.
	  function onclose() {
	    dest.removeListener('finish', onfinish);
	    unpipe();
	  }
	  dest.once('close', onclose);
	  function onfinish() {
	    debug('onfinish');
	    dest.removeListener('close', onclose);
	    unpipe();
	  }
	  dest.once('finish', onfinish);

	  function unpipe() {
	    debug('unpipe');
	    src.unpipe(dest);
	  }

	  // tell the dest that it's being piped to
	  dest.emit('pipe', src);

	  // start the flow if it hasn't been started already.
	  if (!state.flowing) {
	    debug('pipe resume');
	    src.resume();
	  }

	  return dest;
	};

	function pipeOnDrain(src) {
	  return function () {
	    var state = src._readableState;
	    debug('pipeOnDrain', state.awaitDrain);
	    if (state.awaitDrain) state.awaitDrain--;
	    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
	      state.flowing = true;
	      flow(src);
	    }
	  };
	}

	Readable.prototype.unpipe = function (dest) {
	  var state = this._readableState;

	  // if we're not piping anywhere, then do nothing.
	  if (state.pipesCount === 0) return this;

	  // just one destination.  most common case.
	  if (state.pipesCount === 1) {
	    // passed in one, but it's not the right one.
	    if (dest && dest !== state.pipes) return this;

	    if (!dest) dest = state.pipes;

	    // got a match.
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;
	    if (dest) dest.emit('unpipe', this);
	    return this;
	  }

	  // slow case. multiple pipe destinations.

	  if (!dest) {
	    // remove all.
	    var dests = state.pipes;
	    var len = state.pipesCount;
	    state.pipes = null;
	    state.pipesCount = 0;
	    state.flowing = false;

	    for (var _i = 0; _i < len; _i++) {
	      dests[_i].emit('unpipe', this);
	    }return this;
	  }

	  // try to find the right one.
	  var i = indexOf(state.pipes, dest);
	  if (i === -1) return this;

	  state.pipes.splice(i, 1);
	  state.pipesCount -= 1;
	  if (state.pipesCount === 1) state.pipes = state.pipes[0];

	  dest.emit('unpipe', this);

	  return this;
	};

	// set up data events if they are asked for
	// Ensure readable listeners eventually get something
	Readable.prototype.on = function (ev, fn) {
	  var res = Stream.prototype.on.call(this, ev, fn);

	  // If listening to data, and it has not explicitly been paused,
	  // then call resume to start the flow of data on the next tick.
	  if (ev === 'data' && false !== this._readableState.flowing) {
	    this.resume();
	  }

	  if (ev === 'readable' && !this._readableState.endEmitted) {
	    var state = this._readableState;
	    if (!state.readableListening) {
	      state.readableListening = true;
	      state.emittedReadable = false;
	      state.needReadable = true;
	      if (!state.reading) {
	        processNextTick(nReadingNextTick, this);
	      } else if (state.length) {
	        emitReadable(this, state);
	      }
	    }
	  }

	  return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;

	function nReadingNextTick(self) {
	  debug('readable nexttick read 0');
	  self.read(0);
	}

	// pause() and resume() are remnants of the legacy readable stream API
	// If the user uses them, then switch into old mode.
	Readable.prototype.resume = function () {
	  var state = this._readableState;
	  if (!state.flowing) {
	    debug('resume');
	    state.flowing = true;
	    resume(this, state);
	  }
	  return this;
	};

	function resume(stream, state) {
	  if (!state.resumeScheduled) {
	    state.resumeScheduled = true;
	    processNextTick(resume_, stream, state);
	  }
	}

	function resume_(stream, state) {
	  if (!state.reading) {
	    debug('resume read 0');
	    stream.read(0);
	  }

	  state.resumeScheduled = false;
	  stream.emit('resume');
	  flow(stream);
	  if (state.flowing && !state.reading) stream.read(0);
	}

	Readable.prototype.pause = function () {
	  debug('call pause flowing=%j', this._readableState.flowing);
	  if (false !== this._readableState.flowing) {
	    debug('pause');
	    this._readableState.flowing = false;
	    this.emit('pause');
	  }
	  return this;
	};

	function flow(stream) {
	  var state = stream._readableState;
	  debug('flow', state.flowing);
	  if (state.flowing) {
	    do {
	      var chunk = stream.read();
	    } while (null !== chunk && state.flowing);
	  }
	}

	// wrap an old-style stream as the async data source.
	// This is *not* part of the readable stream interface.
	// It is an ugly unfortunate mess of history.
	Readable.prototype.wrap = function (stream) {
	  var state = this._readableState;
	  var paused = false;

	  var self = this;
	  stream.on('end', function () {
	    debug('wrapped end');
	    if (state.decoder && !state.ended) {
	      var chunk = state.decoder.end();
	      if (chunk && chunk.length) self.push(chunk);
	    }

	    self.push(null);
	  });

	  stream.on('data', function (chunk) {
	    debug('wrapped data');
	    if (state.decoder) chunk = state.decoder.write(chunk);

	    // don't skip over falsy values in objectMode
	    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

	    var ret = self.push(chunk);
	    if (!ret) {
	      paused = true;
	      stream.pause();
	    }
	  });

	  // proxy all the other methods.
	  // important when wrapping filters and duplexes.
	  for (var i in stream) {
	    if (this[i] === undefined && typeof stream[i] === 'function') {
	      this[i] = function (method) {
	        return function () {
	          return stream[method].apply(stream, arguments);
	        };
	      }(i);
	    }
	  }

	  // proxy certain important events.
	  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
	  forEach(events, function (ev) {
	    stream.on(ev, self.emit.bind(self, ev));
	  });

	  // when we try to consume some more bytes, simply unpause the
	  // underlying stream.
	  self._read = function (n) {
	    debug('wrapped _read', n);
	    if (paused) {
	      paused = false;
	      stream.resume();
	    }
	  };

	  return self;
	};

	// exposed for testing purposes only.
	Readable._fromList = fromList;

	// Pluck off n bytes from an array of buffers.
	// Length is the combined lengths of all the buffers in the list.
	function fromList(n, state) {
	  var list = state.buffer;
	  var length = state.length;
	  var stringMode = !!state.decoder;
	  var objectMode = !!state.objectMode;
	  var ret;

	  // nothing in the list, definitely empty.
	  if (list.length === 0) return null;

	  if (length === 0) ret = null;else if (objectMode) ret = list.shift();else if (!n || n >= length) {
	    // read it all, truncate the array.
	    if (stringMode) ret = list.join('');else if (list.length === 1) ret = list[0];else ret = Buffer.concat(list, length);
	    list.length = 0;
	  } else {
	    // read just some of it.
	    if (n < list[0].length) {
	      // just take a part of the first list item.
	      // slice is the same for buffers and strings.
	      var buf = list[0];
	      ret = buf.slice(0, n);
	      list[0] = buf.slice(n);
	    } else if (n === list[0].length) {
	      // first list is a perfect match
	      ret = list.shift();
	    } else {
	      // complex case.
	      // we have enough to cover it, but it spans past the first buffer.
	      if (stringMode) ret = '';else ret = new Buffer(n);

	      var c = 0;
	      for (var i = 0, l = list.length; i < l && c < n; i++) {
	        var buf = list[0];
	        var cpy = Math.min(n - c, buf.length);

	        if (stringMode) ret += buf.slice(0, cpy);else buf.copy(ret, c, 0, cpy);

	        if (cpy < buf.length) list[0] = buf.slice(cpy);else list.shift();

	        c += cpy;
	      }
	    }
	  }

	  return ret;
	}

	function endReadable(stream) {
	  var state = stream._readableState;

	  // If we get here before consuming all the bytes, then that is a
	  // bug in node.  Should never happen.
	  if (state.length > 0) throw new Error('endReadable called on non-empty stream');

	  if (!state.endEmitted) {
	    state.ended = true;
	    processNextTick(endReadableNT, state, stream);
	  }
	}

	function endReadableNT(state, stream) {
	  // Check that we didn't get one last unshift.
	  if (!state.endEmitted && state.length === 0) {
	    state.endEmitted = true;
	    stream.readable = false;
	    stream.emit('end');
	  }
	}

	function forEach(xs, f) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    f(xs[i], i);
	  }
	}

	function indexOf(xs, x) {
	  for (var i = 0, l = xs.length; i < l; i++) {
	    if (xs[i] === x) return i;
	  }
	  return -1;
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 199 */
/***/ (function(module, exports) {

	/* (ignored) */

/***/ }),
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var Buffer = __webpack_require__(58).Buffer;

	var isBufferEncoding = Buffer.isEncoding
	  || function(encoding) {
	       switch (encoding && encoding.toLowerCase()) {
	         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
	         default: return false;
	       }
	     }


	function assertEncoding(encoding) {
	  if (encoding && !isBufferEncoding(encoding)) {
	    throw new Error('Unknown encoding: ' + encoding);
	  }
	}

	// StringDecoder provides an interface for efficiently splitting a series of
	// buffers into a series of JS strings without breaking apart multi-byte
	// characters. CESU-8 is handled as part of the UTF-8 encoding.
	//
	// @TODO Handling all encodings inside a single object makes it very difficult
	// to reason about this code, so it should be split up in the future.
	// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
	// points as used by CESU-8.
	var StringDecoder = exports.StringDecoder = function(encoding) {
	  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
	  assertEncoding(encoding);
	  switch (this.encoding) {
	    case 'utf8':
	      // CESU-8 represents each of Surrogate Pair by 3-bytes
	      this.surrogateSize = 3;
	      break;
	    case 'ucs2':
	    case 'utf16le':
	      // UTF-16 represents each of Surrogate Pair by 2-bytes
	      this.surrogateSize = 2;
	      this.detectIncompleteChar = utf16DetectIncompleteChar;
	      break;
	    case 'base64':
	      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
	      this.surrogateSize = 3;
	      this.detectIncompleteChar = base64DetectIncompleteChar;
	      break;
	    default:
	      this.write = passThroughWrite;
	      return;
	  }

	  // Enough space to store all bytes of a single character. UTF-8 needs 4
	  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
	  this.charBuffer = new Buffer(6);
	  // Number of bytes received for the current incomplete multi-byte character.
	  this.charReceived = 0;
	  // Number of bytes expected for the current incomplete multi-byte character.
	  this.charLength = 0;
	};


	// write decodes the given buffer and returns it as JS string that is
	// guaranteed to not contain any partial multi-byte characters. Any partial
	// character found at the end of the buffer is buffered up, and will be
	// returned when calling write again with the remaining bytes.
	//
	// Note: Converting a Buffer containing an orphan surrogate to a String
	// currently works, but converting a String to a Buffer (via `new Buffer`, or
	// Buffer#write) will replace incomplete surrogates with the unicode
	// replacement character. See https://codereview.chromium.org/121173009/ .
	StringDecoder.prototype.write = function(buffer) {
	  var charStr = '';
	  // if our last write ended with an incomplete multibyte character
	  while (this.charLength) {
	    // determine how many remaining bytes this buffer has to offer for this char
	    var available = (buffer.length >= this.charLength - this.charReceived) ?
	        this.charLength - this.charReceived :
	        buffer.length;

	    // add the new bytes to the char buffer
	    buffer.copy(this.charBuffer, this.charReceived, 0, available);
	    this.charReceived += available;

	    if (this.charReceived < this.charLength) {
	      // still not enough chars in this buffer? wait for more ...
	      return '';
	    }

	    // remove bytes belonging to the current character from the buffer
	    buffer = buffer.slice(available, buffer.length);

	    // get the character that was split
	    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

	    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	    var charCode = charStr.charCodeAt(charStr.length - 1);
	    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	      this.charLength += this.surrogateSize;
	      charStr = '';
	      continue;
	    }
	    this.charReceived = this.charLength = 0;

	    // if there are no more bytes in this buffer, just emit our char
	    if (buffer.length === 0) {
	      return charStr;
	    }
	    break;
	  }

	  // determine and set charLength / charReceived
	  this.detectIncompleteChar(buffer);

	  var end = buffer.length;
	  if (this.charLength) {
	    // buffer the incomplete character bytes we got
	    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
	    end -= this.charReceived;
	  }

	  charStr += buffer.toString(this.encoding, 0, end);

	  var end = charStr.length - 1;
	  var charCode = charStr.charCodeAt(end);
	  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
	  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
	    var size = this.surrogateSize;
	    this.charLength += size;
	    this.charReceived += size;
	    this.charBuffer.copy(this.charBuffer, size, 0, size);
	    buffer.copy(this.charBuffer, 0, 0, size);
	    return charStr.substring(0, end);
	  }

	  // or just emit the charStr
	  return charStr;
	};

	// detectIncompleteChar determines if there is an incomplete UTF-8 character at
	// the end of the given buffer. If so, it sets this.charLength to the byte
	// length that character, and sets this.charReceived to the number of bytes
	// that are available for this character.
	StringDecoder.prototype.detectIncompleteChar = function(buffer) {
	  // determine how many bytes we have to check at the end of this buffer
	  var i = (buffer.length >= 3) ? 3 : buffer.length;

	  // Figure out if one of the last i bytes of our buffer announces an
	  // incomplete char.
	  for (; i > 0; i--) {
	    var c = buffer[buffer.length - i];

	    // See http://en.wikipedia.org/wiki/UTF-8#Description

	    // 110XXXXX
	    if (i == 1 && c >> 5 == 0x06) {
	      this.charLength = 2;
	      break;
	    }

	    // 1110XXXX
	    if (i <= 2 && c >> 4 == 0x0E) {
	      this.charLength = 3;
	      break;
	    }

	    // 11110XXX
	    if (i <= 3 && c >> 3 == 0x1E) {
	      this.charLength = 4;
	      break;
	    }
	  }
	  this.charReceived = i;
	};

	StringDecoder.prototype.end = function(buffer) {
	  var res = '';
	  if (buffer && buffer.length)
	    res = this.write(buffer);

	  if (this.charReceived) {
	    var cr = this.charReceived;
	    var buf = this.charBuffer;
	    var enc = this.encoding;
	    res += buf.slice(0, cr).toString(enc);
	  }

	  return res;
	};

	function passThroughWrite(buffer) {
	  return buffer.toString(this.encoding);
	}

	function utf16DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 2;
	  this.charLength = this.charReceived ? 2 : 0;
	}

	function base64DetectIncompleteChar(buffer) {
	  this.charReceived = buffer.length % 3;
	  this.charLength = this.charReceived ? 3 : 0;
	}


/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(197)


/***/ }),
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(203)


/***/ }),
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

	// a transform stream is a readable/writable stream where you do
	// something with the data.  Sometimes it's called a "filter",
	// but that's not a great name for it, since that implies a thing where
	// some bits pass through, and others are simply ignored.  (That would
	// be a valid example of a transform, of course.)
	//
	// While the output is causally related to the input, it's not a
	// necessarily symmetric or synchronous transformation.  For example,
	// a zlib stream might take multiple plain-text writes(), and then
	// emit a single compressed chunk some time in the future.
	//
	// Here's how this works:
	//
	// The Transform stream has all the aspects of the readable and writable
	// stream classes.  When you write(chunk), that calls _write(chunk,cb)
	// internally, and returns false if there's a lot of pending writes
	// buffered up.  When you call read(), that calls _read(n) until
	// there's enough pending readable data buffered up.
	//
	// In a transform stream, the written data is placed in a buffer.  When
	// _read(n) is called, it transforms the queued up data, calling the
	// buffered _write cb's as it consumes chunks.  If consuming a single
	// written chunk would result in multiple output chunks, then the first
	// outputted bit calls the readcb, and subsequent chunks just go into
	// the read buffer, and will cause it to emit 'readable' if necessary.
	//
	// This way, back-pressure is actually determined by the reading side,
	// since _read has to be called to start processing a new chunk.  However,
	// a pathological inflate type of transform can cause excessive buffering
	// here.  For example, imagine a stream where every byte of input is
	// interpreted as an integer from 0-255, and then results in that many
	// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
	// 1kb of data being output.  In this case, you could write a very small
	// amount of input, and end up with a very large amount of output.  In
	// such a pathological inflating mechanism, there'd be no way to tell
	// the system to stop doing the transform.  A single 4MB write could
	// cause the system to run out of memory.
	//
	// However, even in such a pathological case, only a single written chunk
	// would be consumed, and then the rest would wait (un-transformed) until
	// the results of the previous transformed chunk were consumed.

	'use strict';

	module.exports = Transform;

	var Duplex = __webpack_require__(197);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(Transform, Duplex);

	function TransformState(stream) {
	  this.afterTransform = function (er, data) {
	    return afterTransform(stream, er, data);
	  };

	  this.needTransform = false;
	  this.transforming = false;
	  this.writecb = null;
	  this.writechunk = null;
	  this.writeencoding = null;
	}

	function afterTransform(stream, er, data) {
	  var ts = stream._transformState;
	  ts.transforming = false;

	  var cb = ts.writecb;

	  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

	  ts.writechunk = null;
	  ts.writecb = null;

	  if (data !== null && data !== undefined) stream.push(data);

	  cb(er);

	  var rs = stream._readableState;
	  rs.reading = false;
	  if (rs.needReadable || rs.length < rs.highWaterMark) {
	    stream._read(rs.highWaterMark);
	  }
	}

	function Transform(options) {
	  if (!(this instanceof Transform)) return new Transform(options);

	  Duplex.call(this, options);

	  this._transformState = new TransformState(this);

	  // when the writable side finishes, then flush out anything remaining.
	  var stream = this;

	  // start out asking for a readable event once data is transformed.
	  this._readableState.needReadable = true;

	  // we have implemented the _read method, and done the other things
	  // that Readable wants before the first _read call, so unset the
	  // sync guard flag.
	  this._readableState.sync = false;

	  if (options) {
	    if (typeof options.transform === 'function') this._transform = options.transform;

	    if (typeof options.flush === 'function') this._flush = options.flush;
	  }

	  this.once('prefinish', function () {
	    if (typeof this._flush === 'function') this._flush(function (er) {
	      done(stream, er);
	    });else done(stream);
	  });
	}

	Transform.prototype.push = function (chunk, encoding) {
	  this._transformState.needTransform = false;
	  return Duplex.prototype.push.call(this, chunk, encoding);
	};

	// This is the part where you do stuff!
	// override this function in implementation classes.
	// 'chunk' is an input chunk.
	//
	// Call `push(newChunk)` to pass along transformed output
	// to the readable side.  You may call 'push' zero or more times.
	//
	// Call `cb(err)` when you are done with this chunk.  If you pass
	// an error, then that'll put the hurt on the whole operation.  If you
	// never call cb(), then you'll never get another chunk.
	Transform.prototype._transform = function (chunk, encoding, cb) {
	  throw new Error('not implemented');
	};

	Transform.prototype._write = function (chunk, encoding, cb) {
	  var ts = this._transformState;
	  ts.writecb = cb;
	  ts.writechunk = chunk;
	  ts.writeencoding = encoding;
	  if (!ts.transforming) {
	    var rs = this._readableState;
	    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	  }
	};

	// Doesn't matter what the args are here.
	// _transform does all the work.
	// That we got here means that the readable side wants more data.
	Transform.prototype._read = function (n) {
	  var ts = this._transformState;

	  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
	    ts.transforming = true;
	    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
	  } else {
	    // mark that we need a transform, so that any data that comes in
	    // will get processed, now that we've asked for it.
	    ts.needTransform = true;
	  }
	};

	function done(stream, er) {
	  if (er) return stream.emit('error', er);

	  // if there's nothing in the write buffer, then that means
	  // that nothing more will ever be provided
	  var ws = stream._writableState;
	  var ts = stream._transformState;

	  if (ws.length) throw new Error('calling transform done when ws.length != 0');

	  if (ts.transforming) throw new Error('calling transform done when still transforming');

	  return stream.push(null);
	}

/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(205)


/***/ }),
/* 205 */
/***/ (function(module, exports, __webpack_require__) {

	// a passthrough stream.
	// basically just the most minimal sort of Transform stream.
	// Every written chunk gets output as-is.

	'use strict';

	module.exports = PassThrough;

	var Transform = __webpack_require__(203);

	/*<replacement>*/
	var util = __webpack_require__(61);
	util.inherits = __webpack_require__(2);
	/*</replacement>*/

	util.inherits(PassThrough, Transform);

	function PassThrough(options) {
	  if (!(this instanceof PassThrough)) return new PassThrough(options);

	  Transform.call(this, options);
	}

	PassThrough.prototype._transform = function (chunk, encoding, cb) {
	  cb(null, chunk);
	};

/***/ }),
/* 206 */
/***/ (function(module, exports) {

	module.exports = shift

	function shift (stream) {
	  var rs = stream._readableState
	  if (!rs) return null
	  return rs.objectMode ? stream.read() : stream.read(getStateLength(rs))
	}

	function getStateLength (state) {
	  if (state.buffer.length) {
	    // Since node 6.3.0 state.buffer is a BufferList not an array
	    if (state.buffer.head) {
	      return state.buffer.head.data.length
	    }

	    return state.buffer[0].length
	  }

	  return state.length
	}


/***/ }),
/* 207 */
/***/ (function(module, exports) {

	
	var ws = null

	if (typeof WebSocket !== 'undefined') {
	  ws = WebSocket
	} else if (typeof MozWebSocket !== 'undefined') {
	  ws = MozWebSocket
	} else if (typeof window !== 'undefined') {
	  ws = window.WebSocket || window.MozWebSocket
	}

	module.exports = ws


/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict'

	var websocket = __webpack_require__(177)
	var urlModule = __webpack_require__(165)
	var WSS_OPTIONS = [
	  'rejectUnauthorized',
	  'ca',
	  'cert',
	  'key',
	  'pfx',
	  'passphrase'
	]
	var IS_BROWSER = process.title === 'browser'

	function buildUrl (opts, client) {
	  var url = opts.protocol + '://' + opts.hostname + ':' + opts.port + opts.path
	  if (typeof (opts.transformWsUrl) === 'function') {
	    url = opts.transformWsUrl(url, opts, client)
	  }
	  return url
	}

	function setDefaultOpts (opts) {
	  if (!opts.hostname) {
	    opts.hostname = 'localhost'
	  }
	  if (!opts.port) {
	    if (opts.protocol === 'wss') {
	      opts.port = 443
	    } else {
	      opts.port = 80
	    }
	  }
	  if (!opts.path) {
	    opts.path = '/'
	  }

	  if (!opts.wsOptions) {
	    opts.wsOptions = {}
	  }
	  if (!IS_BROWSER && opts.protocol === 'wss') {
	    // Add cert/key/ca etc options
	    WSS_OPTIONS.forEach(function (prop) {
	      if (opts.hasOwnProperty(prop) && !opts.wsOptions.hasOwnProperty(prop)) {
	        opts.wsOptions[prop] = opts[prop]
	      }
	    })
	  }
	}

	function createWebSocket (client, opts) {
	  var websocketSubProtocol =
	    (opts.protocolId === 'MQIsdp') && (opts.protocolVersion === 3)
	      ? 'mqttv3.1'
	      : 'mqtt'

	  setDefaultOpts(opts)
	  var url = buildUrl(opts, client)
	  return websocket(url, [websocketSubProtocol], opts.wsOptions)
	}

	function buildBuilder (client, opts) {
	  return createWebSocket(client, opts)
	}

	function buildBuilderBrowser (client, opts) {
	  if (!opts.hostname) {
	    opts.hostname = opts.host
	  }

	  if (!opts.hostname) {
	    // Throwing an error in a Web Worker if no `hostname` is given, because we
	    // can not determine the `hostname` automatically.  If connecting to
	    // localhost, please supply the `hostname` as an argument.
	    if (typeof (document) === 'undefined') {
	      throw new Error('Could not determine host. Specify host manually.')
	    }
	    var parsed = urlModule.parse(document.URL)
	    opts.hostname = parsed.hostname

	    if (!opts.port) {
	      opts.port = parsed.port
	    }
	  }
	  return createWebSocket(client, opts)
	}

	if (IS_BROWSER) {
	  module.exports = buildBuilderBrowser
	} else {
	  module.exports = buildBuilder
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(48)))

/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

	var events, inherits;

	events = __webpack_require__(3);
	inherits = __webpack_require__(2);

	/**
	 * @class MessagingAdapter
	 * 
	 * Abstract base class for messaging adapters. Implementations available:
	 * <ul>
	 *  <li>{@link MqttMessagingAdapter}</li>
	 * </ul>
	 * 
	 * @constructor
	 * @abstract
	 * 
	 * @param {string} host
	 * @param {string} port
	 * @param {string} user
	 * 
	 * @fires MessagingAdapter#connectionlost
	 * @fires MessagingAdapter#connectionfailure
	 * @fires MessagingAdapter#connectionestablished
	 * @fires MessagingAdapter#message
	 * 
	 */
	var MessagingAdapter = function (host, port, user) { throw new Error ("Can not create instance of abstract class MessagingAdapter") };

	inherits(MessagingAdapter, events);


	/**
	 * The connection to the messaging server was closed.
	 * @event MessagingAdapter#connectionlost
	 */

	/**
	 * A failure occured during setup of the  connection to the messaging
	 * server.
	 * @event MessagingAdapter#connectionfailure
	 */

	/**
	 * The connection to the messaging server has been established.
	 * @event MessagingAdapter#connectionestablished
	 */

	/**
	 * A message has been received via one of the subscribed channels.
	 * @event MessagingAdapter#message
	 * @property {string} message
	 */

	 /**
	  * Get this messaging client's clientId
	  */
	MessagingAdapter.prototype.getClientId = function () { throw "Not implemented" };
	 
	/**
	 * Send a message to a given channel. Best effort. No ACK.
	 * @param {string} message
	 * @param {string} channel a device's id or  network address e.g. ip_address:port_number 
	 * @param {object} options send options such as delivery guarantees, retain
	 * @param {number} options.qos 0 - at most once, 1 - at least once, 2 - exactly once
	 * @param {boolean} options.retain retain message copy in channel for clients joining after the send.
	 *  
	 */
	MessagingAdapter.prototype.send = function (message, channel, options) { throw "Not implemented" };

	/**
	 * Start listening for messages from a given channel.
	 * @param {string} channel 
	 */
	MessagingAdapter.prototype.listen = function (channel) { throw "Not implemented" };

	/**
	 * Stop  listening for messages to a given channel.
	 * @param {string} channel
	 */
	MessagingAdapter.prototype.stopListen = function (channel) { throw "Not implemented" };

	/**
	 * Stop listening all subscribed channels.
	 */
	MessagingAdapter.prototype.stopListenAll = function (channel) { throw "Not implemented" };

	/**
	 * Terminate connection
	 */
	MessagingAdapter.prototype.disconnect = function (channel) { throw "Not implemented" };

	module.exports = MessagingAdapter;

/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

	var b64EncodeUnicode = __webpack_require__(211).encodeUnicode,
	    b64DecodeUnicode = __webpack_require__(211).decodeUnicode,
	    IdGenerator, MessageId, startTime, count;

	startTime = new Date().getTime();
	count = 0;

	/**
	 * 
	 * @typedef {object} MessageId
	 * @property {number} startTime
	 * @property {number} count
	 */
	MessageId = function (startupTime, count) {
	    this.startTime = startupTime;
	    this.count = count;
	};

	function getNewId () {
	    count++;
	    id = new MessageId(startTime, count);
	    return serialise(id);
	};

	function deserialise (id) {
	    var deserialised = b64DecodeUnicode(id);
	    deserialised = deserialised.split("-");
	    return new MessageId(deserialised[0], deserialised[1]);
	}

	function serialise (id) {
	    var serialised = id.startTime + "-" + id.count;
	    return b64EncodeUnicode(serialised);
	}

	/**
	 * @module
	 * @name MessageIdGenerator
	 */
	module.exports = {

	    /**
	     * Generates an identifier which is unique per Browser session.
	     * @function
	     * @returns {string}
	     */
	    getNewId: getNewId,

	    /**
	     * Deserialises an ID string generated with getNewId.
	     * @function
	     * @returns {MessageId}
	     */
	    deserialise: deserialise
	};

/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer) {// From: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
	function b64EncodeUnicode(str) {
	    return atob(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	        function toSolidBytes(match, p1) {
	            return String.fromCharCode("0x" + p1);
	    }));
	}

	// From: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
	function b64DecodeUnicode(str) {
	    return decodeURIComponent(btoa(str).split("").map(function(c) {
	        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
	    }).join(""));
	}

	function atob (str) {
	    return Buffer.from(str).toString("base64");
	}

	function btoa (str) {
	    return Buffer.from(str, "base64").toString()
	}

	module.exports = {
	    encodeUnicode: b64EncodeUnicode,
	    decodeUnicode: b64DecodeUnicode
	}
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(58).Buffer))

/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2015 British Broadcasting Corporation
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 ****************************************************************************/

	var EventEmitter = __webpack_require__(3);
	var inherits = __webpack_require__(2);
	var SyncProtocols = __webpack_require__(213);
	var createWCSyncClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
	var clocks = __webpack_require__(220);
	var WeakMap = __webpack_require__(4);
	var PRIVATE = new WeakMap();


	/**
	 * @constructor
	 * @param wcServerAddr WallClock sync service (websocket) endpoint
	 * @param wcServerPort WallClock sync service's port number
	 * @param a CorrelatedClock object representing the wallclock to be synced
	 */
	var WallClockSynchroniser = function(wcServerAddr, wcServerPort, wallclock){

	  EventEmitter.call(this);

	  PRIVATE.set(this, {});
	  var priv = PRIVATE.get(this);

	  const self = this;

	  Object.defineProperty(self, "wcServerAddr",  { value: wcServerAddr});
	  Object.defineProperty(self, "wcServerPort",  { value: wcServerPort });
	  Object.defineProperty(self, 'wallclock',     { value: wallclock });

	  priv.wsserver_url  = self.wcServerAddr + (typeof(wcServerPort) !== "undefined" ? (":" + wcServerPort) : "");

	};

	inherits(WallClockSynchroniser, EventEmitter);

	/**
	 *  start
	 */
	WallClockSynchroniser.prototype.start = function(){

	  var priv = PRIVATE.get(this);

	  // open a websocket connection with our WebSocket-to-UDP proxy
	  priv.ws = new WebSocket(priv.wsserver_url);
	  priv.ws.binaryType = 'arraybuffer';

	  // when websocket is connected, create a WallClock sync client (which uses websockets) and start it
	  priv.ws.addEventListener("open", function()
	  {
	    var priv = PRIVATE.get(this);

	    var protocolOptions = { dest: { address:this.wcServerAddr, port:this.wcServerPort} };

	    priv.wcSyncClient = createWCSyncClient(priv.ws, this.wallclock, protocolOptions);

	    // no need to call priv.wcSyncClient.start(), protocol is automatically started if websocket is open
	    // See sync-protocols/SocketAdaptors.WebSocketAdaptor
	    // the wallclock is synced, if it emits a 'change' event (see dvbcss-clocks.CorrelatedClock)

	  }.bind(this));

	};


	/**
	 * stop()
	 */
	WallClockSynchroniser.prototype.stop = function(){
	  var priv = PRIVATE.get(this);

	  priv.wcSyncClient.stop();


	};

	module.exports = WallClockSynchroniser;


/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * and contributions Copyright 2017 Institut f??r Rundfunktechnik.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by Institut f??r Rundfunktechnik (IRT):
	 *     TimelineSynchronisation
	*****************************************************************************/

	module.exports = {
	    WallClock: {
	        createClient:                __webpack_require__(214),
	        createBinaryWebSocketClient: __webpack_require__(215),
	        createJsonWebSocketClient:   __webpack_require__(222),
	        WallClockClientProtocol:     __webpack_require__(217),
	        Candidate:                   __webpack_require__(219),
	        WallClockMessage:            __webpack_require__(218),
	        JsonSerialiser:              __webpack_require__(223),
	        BinarySerialiser:            __webpack_require__(221),
	    },

	    TimelineSynchronisation : {
	      PresentationTimestamps :       __webpack_require__ (224),
	      PresentationTimestamp :        __webpack_require__ (225),
	      ControlTimestamp :             __webpack_require__ (226),
	      TSSetupMessage :               __webpack_require__ (227),
	      TSClientProtocol :             __webpack_require__ (228),
	      createTSClient :               __webpack_require__ (229),
	    },

	    CII : {
	         CIIMessage :       		    __webpack_require__ (230),
	        TimelineProperties :         __webpack_require__ (231),
	        CIIClientProtocol :          __webpack_require__ (232),
	        createCIIClient :            __webpack_require__ (233)
	    },

	    SocketAdaptors: {
	        WebSocketAdaptor:            __webpack_require__(216),
	    },
	};


/***/ }),
/* 214 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * Factory function that creates a Wall Clock client.
	 *
	 * @param {Socket} socket Socket object representing the connection
	 * @param {Adaptor} AdaptorClass Adaptor class for the socket object
	 * @param {Serialiser} serialiser Message seraliser
	 * @param {CorrelatedClock} wallClock
	 * @param {Object} clientOptions
	 * @returns {WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
	 */
	var createClient = function(socket, AdaptorClass, serialiser, wallClock, clientOptions) {
	    return new AdaptorClass(
	        new WallClockClientProtocol(
	            wallClock,
	            serialiser,
	            clientOptions 
	        ),
	        socket);
	};


	module.exports = createClient;


/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var WebSocketAdaptor = __webpack_require__(216);
	var WallClockClientProtocol = __webpack_require__(217);
	var BinarySerialiser = __webpack_require__(221);

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * Factory function that creates a Wall Clock client that uses a WebSocket
	 * and sends/receives protocol messages in binary format.
	 *
	 * @param {WebSocket} webSocket A W3C WebSockets API compatible websocket connection object
	 * @param {CorrelatedClock} wallClock
	 * @param {Object} clientOptions
	 * @returns {dvbcss-protocols.SocketAdaptors.WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
	 */
	var createBinaryWebSocketClient = function(webSocket, wallClock, clientOptions) {
	    return new WebSocketAdaptor(
	        new WallClockClientProtocol(
	            wallClock,
	            BinarySerialiser,
	            clientOptions
	        ),
	        webSocket);
	};


	module.exports = createBinaryWebSocketClient;


/***/ }),
/* 216 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.SocketAdaptors
	 * @class
	 * @description
	 * Adaptor that manages a websocket connection and interfaces it to a protocol handler.
	 *
	 * <p>It calls the handleMessage() method of the protocol handler when messages are received.
	 * And it listens for {event:send} fired by the protocol handler to send messages.
	 *
	 * <p>The destination routing information is not used because WebSockets are connection oriented.
	 *
	 * @implements SocketAdaptor
	 * @constructor
	 * @param {ProtocolHandler} ProtocolHandler
	 * @param {WebSocket} webSocket
	 * @listens send
	 */
	var WebSocketAdaptor = function(protocolHandler, webSocket) {

	    var handlers = {
	        open: function(evt) {
	            protocolHandler.start();
	        }.bind(this),

	        close: function(evt) {
	            protocolHandler.stop();
	        }.bind(this),

	        message: function(evt) {
	//          console.log("WebSocketAdaptor. received msg");
	//          //console.log(evt);

	            var msg;
	            if (evt.binary) {
	                msg = new Uint8Array(evt.data).buffer;
	            } else {
	                msg = evt.data;
	            }

	            protocolHandler.handleMessage(msg, null); // no routing information
	        }.bind(this)
	    }

	    webSocket.addEventListener("open",    handlers.open);
	    webSocket.addEventListener("close",   handlers.close);
	    webSocket.addEventListener("message", handlers.message);

	    // handle requests to send
	    var send = function(msg, dest) {

	//      console.log(msg);
	//      console.log(dest);


	        // binary parameter is support for https://github.com/websockets/ws
	        // is ignored by W3C compliant websocket libraries

	        var isBinary = msg instanceof ArrayBuffer;
	        webSocket.send(msg, { binary: isBinary });

	    };

	    protocolHandler.on("send", send);

	    // if already open, commence
	    if (webSocket.readyState == 1) {
	        protocolHandler.start();
	    }

	    /**
	     * Force this adaptor to stop. Also calls the stop() method of the protocol handlers
	     */
	    this.stop = function() {
	        webSocket.removeEventListener("open",    handlers.open);
	        webSocket.removeEventListener("close",   handlers.close);
	        webSocket.removeEventListener("message", handlers.message);
	        protocolHandler.removeListener("send", send);
	        protocolHandler.stop();
	    };

	    this.isStarted = function(){

	        return(protocolHandler.isStarted());
	    };

	};

	module.exports = WebSocketAdaptor;


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Telecommunications (BT) PLC: options.logFunction and priv.log
	*****************************************************************************/

	var events = __webpack_require__(3);
	var inherits = __webpack_require__(2);

	var WallClockMessage = __webpack_require__(218);
	var Candidate = __webpack_require__(219);
	var CorrelatedClock = __webpack_require__(220).CorrelatedClock;

	var WeakMap = (typeof window !== "undefined" && window.WeakMap) || __webpack_require__(4);
	var PRIVATE = new WeakMap();

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @class
	 * @description
	 *
	 * Protocol handler that implements a Wall Clock Client.
	 *
	 * <p>Emits a {@link event:send} to send messages, and is passed received
	 * messages by calling [handleMessage()]{@link WallClockClientProtocol#handleMessage}
	 *
	 * <p>Is independent of the underlying type of connection (e.g. WebSocket / UDP)
	 * and of the message format used on the wire. You provide a {ProtocolSerialiser}
	 *
	 * <p>Message payloads for sending or receiving are accompanied by opaque "destination"
	 * routing data that this class uses as an opaque handle for the server being interacted
	 * with.
	 *
	 * @implements ProtocolHandler
	 *
	 * @constructor
	 * @param {CorrelatedClock} wallClock
	 * @param {ProtocolSerialiser} serialiser Object with pack() and unpack() methods, suitable for this particular protocol
	 * @param {object} [options] Protocol handler options
	 * @param {Number} [options.requestInterval] The minimum interval between requests (in milliseconds)
	 * @param {Number} [options.followupTimeout] The timeout on waiting for promised follow-up responses (in milliseconds)
	 * @param {Function} [options.logFunction] The function to call to log output debug messages, this defaults to console.log
	 * @param {*} [options.dest] The destination that the client should use when sending not in response to a received message. The value used here will depend on the {SocketAdaptor} being used.
	 *
	 */
	var WallClockClientProtocol = function(wallClock, serialiser, options) {
	    events.EventEmitter.call(this);
	    PRIVATE.set(this, {});
	    var priv = PRIVATE.get(this);

	    priv.serialiser = serialiser;

	    priv.wallClock = wallClock;
	    priv.parentClock = wallClock.parent;

	    // initially unavailable and infinite dispersion
	    priv.wallClock.correlation = priv.wallClock.correlation.butWith({initialError:Number.POSITIVE_INFINITY});
	    priv.wallClock.speed = 1
	    priv.wallClock.availabilityFlag = false;

	    priv.altClock = new CorrelatedClock(priv.parentClock, {tickRate:wallClock.tickRate, correlation:wallClock.correlation});

	    priv.sendTimer = null;

	    priv.requestInterval = (options.requestInterval>0)?options.requestInterval:1000; // default
	    priv.followupTimeout = (options.followupTimeout>0)?options.followupTimeout:3000; // default

	    priv.log = (typeof options.logFunction === "function") ?  options.logFunction : function() {};

	    priv.log("WallClockClientProtocol constructor: ", options);
	    priv.dest = (options.dest)?options.dest:null;
	    //priv.log(priv.dest);

	    priv.responseCache =new Map();
	    priv.started = false;
	}

	inherits(WallClockClientProtocol, events.EventEmitter);

	/**
	 * @inheritdocs
	 */
	WallClockClientProtocol.prototype.start = function() {
	    var priv = PRIVATE.get(this);
	    priv.log("in WallClockClientProtocol.prototype.start");
	    this._sendRequest();

	    priv.started = true;
	}

	/**
	 * @inheritdocs
	 */
	WallClockClientProtocol.prototype.stop = function() {
	    var priv = PRIVATE.get(this);

	    if (priv.sendTimer) {
	        clearTimeout(priv.sendTimer);
	        priv.sendTimer = null;
	    }

	    priv.started = false;
	}

	/**
	 * Handle the process of sending a request to the WC server
	 * @private
	 */
	WallClockClientProtocol.prototype._sendRequest = function() {
	    var priv = PRIVATE.get(this);

	    // cancel any existing timer
	    if (priv.sendTimer) {
	        clearTimeout(priv.sendTimer);
	        priv.sendTimer = null;
	    }

	    // send a request
	    var t = WallClockMessage.nanosToSecsAndNanos(priv.parentClock.getNanos());
	    var msg = WallClockMessage.makeRequest(t[0],t[1]);
	    msg = priv.serialiser.pack(msg);

	//   priv.log("in WallClockClientProtocol.prototype._sendRequest");
	//   priv.log(msg);
	//   priv.log(priv.dest);

	    this.emit("send", msg, priv.dest);

	    // schedule the timer
	    priv.sendTimer = setTimeout(this._sendRequest.bind(this), priv.requestInterval);
	}

	/**
	 * Handle a received Wall clock protocol message
	 * @param {Object} msg The received message, not already deserialised
	 * @param {*} routing Opaque data to be passed back when sending the response, to ensure it is routed back to the sender
	 */
	WallClockClientProtocol.prototype.handleMessage = function(msg, routing) {
	    var priv = PRIVATE.get(this);

	    var t4 = priv.parentClock.getNanos();

	    msg = priv.serialiser.unpack(msg);

	    var key = ""+msg.originate_timevalue_secs+":"+msg.originate_timevalue_nanos;

	    if (msg.type == WallClockMessage.TYPES.responseWithFollowUp) {

	        // follow-up is promised ... set timeout to use it
	        var handle = setTimeout(function() {
	            priv.responseCache.delete(key);
	            this._updateClockIfCandidateIsImprovement(msg, t4);
	        }.bind(this), priv.followupTimeout);
	        priv.responseCache.set(key, handle);

	    } else {
	        if (msg.type == WallClockMessage.TYPES.followUp) {
	            // followup! cancel the timer, if one is cached
	            if (priv.responseCache.has(key)) {
	                var handle = priv.responseCache.get(key);
	                clearTimeout(handle);
	                priv.responseCache.delete(key);
	            }
	        }
	        this._updateClockIfCandidateIsImprovement(msg, t4);
	    }
	}

	WallClockClientProtocol.prototype._updateClockIfCandidateIsImprovement = function(msg,t4) {
	    var priv = PRIVATE.get(this);

	    var candidate = new Candidate(msg,t4);
	    var candidateCorrelation = candidate.toCorrelation(priv.wallClock);

	    priv.altClock.setCorrelation(candidateCorrelation);

	    var now = priv.wallClock.now();

	    var dispersionNew = priv.altClock.dispersionAtTime(now);
	    var dispersionExisting = priv.wallClock.dispersionAtTime(now);

	    if (dispersionNew < dispersionExisting) {
	        priv.wallClock.correlation = priv.altClock.correlation;
	        priv.wallClock.availabilityFlag = true;
	    }
	}

	/**
	 * Returns true if this protocol handler is started.
	 */
	WallClockClientProtocol.prototype.isStarted = function() {
	    var priv = PRIVATE.get(this);

	    return priv.started ? true:false;
	}

	module.exports = WallClockClientProtocol;


/***/ }),
/* 218 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @class
	 * @description
	 * Object for representing a wall clock message. User a {@link ProtocolSerialiser} to convert to/from the format in which the message is carried on the wire.
	 *
	 * @constructor
	 * @param {Number} version Should be 0.
	 * @param {dvbcss-protocols.WallClock.WallClockMessage.TYPES} type.
	 * @param {Number} precision Clock precision (in seconds and fractions of a second).
	 * @param {Number} max_freq_error Clock maximum frequency error (in ppm).
	 * @param {Number} originate_timevalue_secs Request sent time (seconds part)
	 * @param {Number} originate_timevalue_nanos Request sent time (nanoseconds part)
	 * @param {Number} receive_timevalue Request received time (seconds+fractions of second)
	 * @param {Number} transmit_timevalue Response sent time (seconds+fractions of second)
	 */
	var WallClockMessage = function(version, type, precision, max_freq_error, originate_timevalue_secs, originate_timevalue_nanos, receive_timevalue, transmit_timevalue) {
	    
	    /**
	     * @type Number
	     * @desc Protocol message format version.
	     */
	    this.version = version;
	    /**
	     * @type WallClockMessage.TYPES
	     * @desc Message type
	     */
	    this.type = type;
	    /**
	     * @type Number
	     * @desc Clock precision (in seconds and fractions of a second).
	     */
	    this.precision = precision;
	    /**
	     * @type Number
	     * @desc Clock maximum frequency error (in ppm).
	     */
	    this.max_freq_error = max_freq_error;
	    /**
	     * @type Number
	     * @desc Request sent time (seconds part)
	     */
	    this.originate_timevalue_secs = originate_timevalue_secs;
	    /**
	     * @type Number
	     * @desc Request sent time (nanoseconds part)
	     */
	    this.originate_timevalue_nanos = originate_timevalue_nanos;
	    /**
	     * @type Number
	     * @desc Request received time (seconds+fractions of second)
	     */
	    this.receive_timevalue = receive_timevalue;
	    /**
	     * @type Number
	     * @desc Response sent time (seconds+fractions of second)
	     */
	    this.transmit_timevalue = transmit_timevalue;
	}

	/**
	 * Values permitted for the 'type' field in a wall clock message
	 * @enum {Number}
	 */ 
	WallClockMessage.TYPES = {
	    /** 0 - request **/
	    request: 0,
	    /** 1 - response **/
	    response: 1,
	    /** 2 - response with follow-up promised **/
	    responseWithFollowUp: 2,
	    /** 3 - follow-up response **/
	    followUp: 3
	};

	/**
	 * @returns True if this message object represents a response message
	 */
	WallClockMessage.prototype.isResponse = function() {
	    switch (this.type) {
	        case WallClockMessage.TYPES.response:
	        case WallClockMessage.TYPES.responseWithFollowUp:
	        case WallClockMessage.TYPES.followUp:
	            return true;
	        default:
	            return false;
	    }
	};

	/**
	 * Make an object representing a wall clock protocol request
	 * @param {Number} localSendtimeSecs The seconds part of the send time
	 * @param {Number} localSendTimeNanos The nanoseconds part of the send time
	 * @returns {WallClockMessage} object representing Wall Clock protocol message
	 */
	WallClockMessage.makeRequest = function(localSendtimeSecs, localSendTimeNanos) {
	    return new WallClockMessage(0, WallClockMessage.TYPES.request, 0, 0, localSendtimeSecs, localSendTimeNanos, 0, 0);
	};

	/**
	 * Create a response message based on this request message
	 * @param {WallClockMessage} requestMsg object representing received wall clock request message
	 * @param {WC_MSG_TYPES} responseType the type field for the message
	 * @param {Number} rxTime The time at which the request was received (in nanoseconds)
	 * @param {Number} txTime The time at which this response is being sent (in nanoseconds)
	 * @returns {WallClockMessage} New object representing the response message
	 */
	WallClockMessage.prototype.toResponse = function(responseType, precision, max_freq_error, rxTime, txTime) {
	    return new WallClockMessage(
	        this.version,
	        responseType,
	        precision,
	        max_freq_error,
	        this.originate_timevalue_secs,
	        this.originate_timevalue_nanos,
	        rxTime,
	        txTime
	    );
	};


	/**
	 * @returns True if the properties of this object match this one
	 */
	WallClockMessage.prototype.equals = function(obj) {
	    if (typeof obj === "undefined" || obj == null) { return false; }
	    
	    return this.version === obj.version &&
	        this.type === obj.type &&
	        this.precision === obj.precision &&
	        this.max_freq_error === obj.max_freq_error &&
	        this.originate_timevalue_secs === obj.originate_timevalue_secs &&
	        this.originate_timevalue_nanos === obj.originate_timevalue_nanos &&
	        this.receive_timevalue === obj.receive_timevalue &&
	        this.transmit_timevalue === obj.transmit_timevalue;
	}


	/**
	 * convert a timevalue (in units of nanoseconds) into separate values representing a seconds part and a fractional nanoseconds part
	 * @param {Number} time value in nanoseconds
	 * @returns {Number[]} array of two numbers [secs, nanos] containing the seconds and the nanoseconds
	 */
	WallClockMessage.nanosToSecsAndNanos = function(n) {
	    var secs = Math.trunc(n / 1000000000);
	    var nanos = Math.trunc(n % 1000000000);
	    return [secs,nanos]
	};

	/**
	 * convert separate seconds and nanoseconds values into a single nanosecond time value
	 * @param {Number} secs Seconds part only
	 * @param {Number} nanos Nanoseconds part only
	 * @return {Number} combined time value (in nanoseconds)
	 */
	WallClockMessage.secsAndNanosToNanos = function(secs, nanos) {
	    return (Math.trunc(secs)*1000000000) + Math.trunc(nanos % 1000000000);
	};


	module.exports = WallClockMessage;


/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var Correlation = __webpack_require__(220).Correlation;
	var WallClockMessage = __webpack_require__(218);

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * Reperesents a measurement candidate. Is derived from a response {WallClockMessage}
	 *
	 * <p>All values in units of nanoseconds or ppm
	 *
	 * @constructor
	 * @param {WallClockMessage} WallClockMessage A response message from which the candidate will be based.
	 * @param {Number} nanosRx Time the message was received (in nanoseconds)
	 */
	var Candidate = function(wcMsg, nanosRx) {
	    if (!wcMsg.isResponse()) {
	        throw "Not a response message";
	    }
	    
	    /**
	     * @type Number
	     * @desc Request sent time (in nanoseconds)
	     */
	    this.t1 = WallClockMessage.secsAndNanosToNanos(wcMsg.originate_timevalue_secs, wcMsg.originate_timevalue_nanos);
	    /**
	     * @type Number
	     * @desc Request received time (in nanoseconds)
	     */
	    this.t2 = wcMsg.receive_timevalue * 1000000000;
	    /**
	     * @type Number
	     * @desc Response sent time (in nanoseconds)
	     */
	    this.t3 = wcMsg.transmit_timevalue * 1000000000;
	    /**
	     * @type Number
	     * @desc Response received time (in nanoseconds)
	     */
	    this.t4 = nanosRx;
	    /**
	     * @type Number
	     * @desc Clock precision (in nanoseconds)
	     */
	    this.precision = wcMsg.precision * 1000000000;
	    /**
	     * @type Number
	     * @desc Maximum frequency error (in ppm)
	     */
	    this.mfe = wcMsg.max_freq_error;
	    /**
	     * @type Number
	     * @desc The WallClockMessage from which this candidate was derived
	     */
	    this.msg = wcMsg;
	};

	/**
	 * Returns a Correlation that corresponds to the measurement represented by this Candidate
	 *
	 * @param {CorrelatedClock} clock The clock that the correlation will be applied to
	 * @returns {Correlation} correlation representing the candidate, including error/uncertainty information
	 */
	Candidate.prototype.toCorrelation = function(clock) {
	    var t1 = clock.parent.fromNanos(this.t1);
	    var t4 = clock.parent.fromNanos(this.t4);
	    var t2 = clock.fromNanos(this.t2);
	    var t3 = clock.fromNanos(this.t3);
	    
	    var rtt = (this.t4-this.t1) - (this.t3-this.t2);
	    
	    var mfeC = clock.getRootMaxFreqError() / 1000000; // ppm to fraction
	    var mfeS = this.mfe / 1000000; // ppm to fraction
	    
	    var c = new Correlation({
	        parentTime: (t1+t4)/2,
	        childTime:  (t2+t3)/2,
	        initialError: ( 
	                this.precision +
	                rtt / 2 + 
	                mfeC*(this.t4-this.t1) + mfeS*(this.t3-this.t2)
	            ) / 1000000000, // nanos to secs
	        errorGrowthRate: mfeC+mfeS
	    });
	    return c;
	};

	module.exports = Candidate;


/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["dvbcss-clocks"] = factory();
		else
			root["dvbcss-clocks"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};

	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {

	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;

	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};

	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;

	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}


	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;

	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;

	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";

	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ (function(module, exports, __webpack_require__) {

		module.exports = __webpack_require__(1);


	/***/ }),
	/* 1 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		*****************************************************************************/

		var ClockBase = __webpack_require__(2);
		var DateNowClock = __webpack_require__(6);
		var CorrelatedClock = __webpack_require__(8);
		var Correlation = __webpack_require__(9);
		var OffsetClock = __webpack_require__(10);

		/**
		 * @module dvbcss-clocks
		 *
		 * @description
		 * The dvbcss-clocks library consists of this module containing the clock classes:
		 *
		 * <ul>
		 *   <li> dvbcss-clocks.{@link ClockBase} - base class for all clock implementations.
		 *   <li> cdvbcss-locks.{@link DateNowClock} - a root clock based on <tt>Date.now()</tt>
		 *   <li> dvbcss-clocks.{@link CorrelatedClock} - a clock based on a parent using a correlation.
		 *   <li> dvbcss-clocks.{@link Correlation} - a correlation.
		 *   <li> dvbcss-clocks.{@link OffsetClock} - a clock that applies a fixed offset to enable compensating for rendering latency.
		 * </ul>
		 *
		 * <p>Clock can be built into hierarchies, where one clock is the root, and other
		 * clocks use it as their parent, and others use those as their parents etc.
		 *
		 * <p>Clocks raise events, and listen to events from their parents:
		 * <ul>
		 *   <li> {@link event:change} ... when any change occurs to a clock, or it is affected by a change of its parents.
		 *   <li> {@link event:available} ... when aa clock becomes flagged available
		 *   <li> {@link event:unavailable} ... when aa clock becomes flagged unavailable
		 * </ul>
		 */
		module.exports = {
		    /**
		     * base class for all clock implementations
		     * @see ClockBase
		     */
		    ClockBase: ClockBase,
		    /**
		     * a root clock based on <tt>Date.now()</tt>
		     * @see DateNowClock
		     */
		    DateNowClock: DateNowClock,
		    /**
		     * a clock based on a parent using a correlation.
		     * @see CorrelatedClock
		     */
		    CorrelatedClock: CorrelatedClock,
		    /**
		     * a correlation.
		     * @see Correlation
		     */
		    Correlation: Correlation,
		    /**
		     * a clock that applies a fixed offset to enable compensating for rendering latency.
		     * @see OffsetClock
		     */
		    OffsetClock: OffsetClock
		};


	/***/ }),
	/* 2 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		 *
		 * --------------------------------------------------------------------------
		 * Summary of parts containing contributions
		 *   by British Telecommunications (BT) PLC:
		 *     CorrelatedClock.prototype.setAtTime
		 *     CorrelatedClock.prototype._rescheduleTimers
		*****************************************************************************/

		var EventEmitter = __webpack_require__(3);
		var inherits = __webpack_require__(4);

		var WeakMap = __webpack_require__(5);
		var PRIVATE = new WeakMap();

		var nextIdNum = 0;
		var nextTimeoutHandle = 0;


		/**
		 * There has been a change in the timing of this clock.
		 * This might be due to a change made directly to this clock, or a change
		 * made to a parent in the hierarchy that affected this clock.
		 *
		 * <p>Causes of changes to clocks include: changes to
		 * [speed]{@link ClockBase#speed},
		 * [tick rate]{@link ClockBase#tickRate},
		 * [correlation]{@link CorrelatedClock#correlation}, or
		 * [parentage]{@link ClockBase#parent}.
		 * Changes to availability do not cause this event to fire.
		 *
		 * <p>The following parameters are passed as arguments to the event handler:
		 * @event change
		 * @param {ClockBase} source The clock that fired the event.
		 */

		/**
		 * This clock has become available.
		 * 
		 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
		 * became true for this clock, or one of its parents in the hierarchy, causing this
		 * clock and all its parents to now be flagged as available.
		 *
		 * <p>The following parameters are passed as arguments to the event handler:
		 * @event available
		 * @param {ClockBase} source The clock that fired the event.
		 */

		/**
		 * This clock has become unavailable.
		 * 
		 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
		 * became false for this clock, or one of its parents in the hierarchy.
		 *
		 * <p>The following parameters are passed as arguments to the event handler:
		 * @event unavailable
		 * @param {ClockBase} source The clock that fired the event.
		 */


		/**
		 * @module clocks
		 * @exports ClockBase
		 * @class ClockBase
		 *
		 * @classdesc
		 * Abstract Base class for clock implementations.
		 *
		 * <p>Implementations that can be used are:
		 * {@link DateNowClock} and
		 * {@link CorrelatedClock}.
		 *
		 * <p>This is the base class on which other clocks are implemented. It provides
		 * the basic framework of properties, getter and setters for common properties
		 * such as availability, speed, tick rate and parents, and provides the basic
		 * events framework, some standard helper methods for time conversion between clocks, comparisons
		 * between clocks and calculating disperison (error/uncertainty).
		 *
		 * <p>Clocks may fire the following events:
		 * <ul>
		 *   <li> [change]{@link event:change} 
		 *   <li> [available]{@link event:available} 
		 *   <li> [unavailable]{@link event:unavailable} 
		 * </ul>
		 *
		 * <p>Clock implementations should inherit from this class and implement some
		 * or all of the following method stubs:
		 *   [now()]{@link ClockBase#now}
		 *   [calcWhen()]{@link ClockBase#calcWhen}
		 *   [getTickRate()]{@link ClockBase#getTickRate}
		 *   [setTickRate()]{@link ClockBase#setTickRate}
		 *   [getSpeed()]{@link ClockBase#getSpeed}
		 *   [setSpeed()]{@link ClockBase#setSpeed}
		 *   [getParent()]{@link ClockBase#getParent}
		 *   [setParent()]{@link ClockBase#setParent}
		 *   [toParentTime()]{@link ClockBase#toParentTime}
		 *   [fromParentTime()]{@link ClockBase#fromParentTime}
		 *   [_errorAtTime()]{@link ClockBase#_errorAtTime}
		 *
		 * @listens change

		 * @constructor
		 * @abstract
		 */
		var ClockBase = function() {
		    EventEmitter.call(this);
		    
		    PRIVATE.set(this, {});
		    var priv = PRIVATE.get(this);

		    this._availability = true;
		    
		    /**
		     * Every clock instance has a unique ID assigned to it for convenience. This is always of the form "clock_N" where N is a unique number.
		     * @var {String} id
		     * @memberof ClockBase
		     * @instance
		     */
		    this.id = "clock_"+nextIdNum;
		    nextIdNum = nextIdNum+1;
		    
		    priv.timerHandles = {};
		    this.on('change', this._rescheduleTimers.bind(this));
		    
		    priv.availablePrev = this._availability;
		};

		inherits(ClockBase, EventEmitter);

		/**
		 * @returns the current time value of this clock in units of ticks of the clock, or NaN if it cannot be determined (e.g. if the clock is missinga parent)
		 * @abstract
		 */
		ClockBase.prototype.now = function() {
		    throw "Unimplemented";
		};

		/**
		 * @var {Number} speed The speed at which this clock is running.
		 * 1.0 = normal. 0.0 = pause. negative values mean it ticks in reverse.
		 *
		 * For some implementations this can be changed, as well as read.
		 *
		 * <p>The underlying implementation of this property uses the
		 * [getSpeed]{@link ClockBase#getSpeed} and
		 * [setSpeed]{@link ClockBase#setSpeed} methods.
		 * @default 1.0
		 * @memberof ClockBase
		 * @instance
		 * @fires change
		 */
		Object.defineProperty(ClockBase.prototype, "speed", {
		    get: function() { return this.getSpeed(); },
		    set: function(v) { return this.setSpeed(v); },
		});

		/**
		 * @var {Number} tickRate The rate of this clock (in ticks per second).
		 *
		 * For some implementations this can be changed, as well as read.
		 *
		 * <p>The underlying implementation of this property uses the
		 * [getTickRate]{@link ClockBase#getTickRate} and
		 * [setTickRate]{@link ClockBase#setTickRate} methods.
		 *
		 * @memberof ClockBase
		 * @instance
		 * @fires change
		 */
		Object.defineProperty(ClockBase.prototype, "tickRate", {
		    get: function() { return this.getTickRate(); },
		    set: function(v) { return this.setTickRate(v); },
		});

		/**
		 * @var {ClockBase} parent The parent of this clock, or <tt>null</tt> if it has no parent.
		 *
		 * For some implementations this can be changed, as well as read.
		 *
		 * <p>The underlying implementation of this property uses the
		 * [getParent]{@link ClockBase#getParent} and
		 * [setParent]{@link ClockBase#setParent} methods.
		 *
		 * @memberof ClockBase
		 * @instance
		 * @fires change
		 */
		Object.defineProperty(ClockBase.prototype, "parent", {
		    get: function() { return this.getParent(); },
		    set: function(v) { return this.setParent(v); },
		});

		/**
		 * @var {Boolean} availabilityFlag The availability flag for this clock.
		 *
		 * For some implementations this can be changed, as well as read.
		 *
		 * <p>This is only the flag for this clock. Its availability may also be affected
		 * by the flags on its parents. To determine true availability, call the
		 * [isAvailable]{@link ClockBase#isAvailable} method.
		 *
		 * <p>The underlying implementation of this property uses the
		 * [getAvailabilityFlag]{@link ClockBase#getAvailabilityFlag} and
		 * [setAvailabilityFlag]{@link ClockBase#setAvailabilityFlag} methods.
		 *
		* @default true
		 * @memberof ClockBase
		 * @instance
		 * @fires change
		 * @fires available
		 * @fires unavailable
		 */
		Object.defineProperty(ClockBase.prototype, "availabilityFlag", {
		    get: function() { return this.getAvailabilityFlag(); },
		    set: function(v) { return this.setAvailabilityFlag(v); },
		});

		/**
		 * Returns the current speed of this clock.
		 * @returns {Number} Speed of this clock.
		 * @abstract
		 */
		ClockBase.prototype.getSpeed = function() {
		    return 1.0;
		};

		/**
		 * Sets the current speed of this clock, or throws an exception if this is not possible
		 * @param {Number} newSpeed The new speed for this clock.
		 * @abstract
		 * @fires change
		 */
		ClockBase.prototype.setSpeed = function(newSpeed) {
		    throw "Unimplemented";
		};

		/**
		 * Calculates the effective speed of this clock, taking into account the effects
		 * of the speed settings for all of its parents.
		 * @returns {Number} the effective speed.
		 */
		ClockBase.prototype.getEffectiveSpeed = function() {
		    var s = 1.0;
		    var clock = this;
		    while (clock !== null) {
		        s = s * clock.getSpeed();
		        clock = clock.getParent();
		    }
		    return s;
		};

		/**
		 * Returns the current tick rate of this clock.
		 * @returns {Number} Tick rate in ticks/second.
		 * @abstract
		 */
		ClockBase.prototype.getTickRate = function() {
		    throw "Unimplemented";
		};

		/**
		 * Sets the current tick rate of this clock, or throws an exception if this is not possible.
		 * @param {Number} newRate New tick rate in ticks/second.
		 * @abstract
		 * @fires change
		 */
		ClockBase.prototype.setTickRate = function(newRate) {
		    throw "Unimplemented";
		};

		/**
		 * Return the current time of this clock but converted to units of nanoseconds, instead of the normal units of the tick rate.
		 * @returns {Number} current time of this clock in nanoseconds.
		 */
		ClockBase.prototype.getNanos = function() {
		    return this.now() * 1000000000 / this.getTickRate();
		};

		/**
		 * Convert a timevalue from nanoseconds to the units of this clock, given its current [tickRate]{@link ClockBase#tickRate}
		 * @param {Number} time in nanoseconds.
		 * @returns {Number} the supplied time converted to units of its tick rate.
		 */
		ClockBase.prototype.fromNanos = function(nanos) {
		    return nanos * this.getTickRate() / 1000000000;
		};

		/**
		 * Is this clock currently available? Given its availability flag and the availability of its parents.
		 * @returns {Boolean} True if this clock is available, and all its parents are available; otherwise false.
		 */
		ClockBase.prototype.isAvailable = function() {
		    var parent = this.getParent();
		    return this._availability && (!parent || parent.isAvailable());
		};

		/**
		 * Sets the availability flag for this clock.
		 * 
		 * <p>This is only the flag for this clock. Its availability may also be affected
		 * by the flags on its parents. To determine true availability, call the
		 * [isAvailable]{@link ClockBase#isAvailable} method.
		 *
		 * @param {Boolean} availability The availability flag for this clock
		 * @fires unavailable
		 * @fires available
		 */
		ClockBase.prototype.setAvailabilityFlag = function(availability) {
		    this._availability = availability;
		    this.notifyAvailabilityChange();
		};

		/**
		 * Cause the "available" or "unavailable" events to fire if availability has
		 * changed since last time this method was called. Subclasses should call this
		 * to robustly generate "available" or "unavailable" events instead of trying
		 * to figure out if there has been a change for themselves.
		 * @fires unavailable
		 * @fires available
		 */
		ClockBase.prototype.notifyAvailabilityChange = function() {
		    var priv = PRIVATE.get(this);
		    
		    var availableNow = this.isAvailable();
		    if (Boolean(availableNow) != Boolean(priv.availablePrev)) {
		        priv.availablePrev = availableNow;
		        this.emit(availableNow?"available":"unavailable", this);
		    }
		};

		/**
		 * Returns the availability flag for this clock (without taking into account whether its parents are available).
		 * 
		 * <p>This is only the flag for this clock. Its availability may also be affected
		 * by the flags on its parents. To determine true availability, call the
		 * [isAvailable]{@link ClockBase#isAvailable} method.
		 *
		 * @returns {Boolean} The availability flag of this clock
		 */
		ClockBase.prototype.getAvailabilityFlag = function() {
		    return this._availability;
		};

		/**
		 * Convert a time value for this clock into a time value corresponding to teh underlying system time source being used by the root clock.
		 *
		 * <p>For example: if this clock is part of a hierarchy, where the root clock of the hierarchy is a [DateNowClock]{@link DateNowClock} then
		 * this method converts the supplied time to be in the same units as <tt>Date.now()</tt>.
		 *
		 * @param {Number} ticksWhen Time value of this clock.
		 * @return {Number} The corresponding time value in the units of the underlying system clock that is being used by the root clock, or <tt>NaN</tt> if this conversion is not possible.
		 * @abstract
		 */
		ClockBase.prototype.calcWhen = function(ticksWhen) {
		    throw "Unimplemented";
		};

		/**
		 * Return the root clock for the hierarchy that this clock is part of.
		 *
		 * <p>If this clock is the root clock (it has no parent), then it will return itself.
		 * 
		 * @return {ClockBase} The root clock of the hierarchy
		 */
		ClockBase.prototype.getRoot = function() {
		    var p = this;
		    var p2 = p.getParent();
		    while (p2) {
		        p=p2;
		        p2=p.getParent();
		    }
		    return p;
		};

		/**
		 * Convert a time for the root clock to a time for this clock.
		 * @param {Number} t A time value of the root clock.
		 * @returns {Number} The corresponding time value for this clock.
		 */
		ClockBase.prototype.fromRootTime = function(t) {
		    var p = this.getParent();
		    if (!p) {
		        return t;
		    } else {
		        var x = p.fromRootTime(t);
		        return this.fromParentTime(x);
		    }
		};

		/**
		 * Convert a time for this clock to a time for the root clock.
		 * @param {Number} t A time value for this clock.
		 * @returns {Number} The corresponding time value of the root clock, or <tt>NaN</tt> if this is not possible.
		 */
		ClockBase.prototype.toRootTime = function(t) {
		    var p = this.getParent();
		    if (!p) {
		        return t;
		    } else {
		        var x = this.toParentTime(t);
		        return p.toRootTime(x);
		    }
		};

		/**
		 * Convert a time value for this clock to a time value for any other clock in the same hierarchy as this one.
		 * @param {ClockBase} otherClock The clock to convert the value value to.
		 * @param {Number} t Time value of this clock.
		 * @returns {Number} The corresponding time value for the specified <tt>otherClock</tt>, or <tt>NaN</tt> if this is not possible.
		 * @throws if this clock is not part of the same hierarchy as the other clock.
		 */
		ClockBase.prototype.toOtherClockTime = function(otherClock, t) {
		    var selfAncestry = this.getAncestry();
		    var otherAncestry = otherClock.getAncestry();
		    var clock;
		    
		    var common = false;
		    while (selfAncestry.length && otherAncestry.length && selfAncestry[selfAncestry.length-1] === otherAncestry[otherAncestry.length-1]) {
		        selfAncestry.pop();
		        otherAncestry.pop();
		        common=true;
		    }
		    
		    if (!common) {
		        throw "No common ancestor clock.";
		    }
		    
		    selfAncestry.forEach(function(clock) {
		        t = clock.toParentTime(t);
		    });
		    
		    otherAncestry.reverse();
		    
		    otherAncestry.forEach(function(clock) {
		        t = clock.fromParentTime(t);
		    });
		    
		    return t;
		};

		/**
		 * Get an array of the clocks that are the parents and ancestors of this clock.
		 * @returns {ClockBase[]} an array starting with this clock and ending with the root clock.
		 */
		ClockBase.prototype.getAncestry = function() {
		    var ancestry = [this];
		    var c = this;
		    while (c) {
		        var p = c.getParent();
		        if (p) {
		            ancestry.push(p);
		        }
		        c=p;
		    }
		    return ancestry;
		};

		/**
		 * Convert time value of this clock to the equivalent time of its parent.
		 *
		 * @param {Number} t Time value of this clock
		 * @returns {Number} corresponding time of the parent clock, or <tt>NaN</tt> if this is not possible.
		 * @abstract
		 */
		ClockBase.prototype.toParentTime = function(t) {
		    throw "Unimplemented";
		};

		/**
		 * Convert time value of this clock's parent to the equivalent time of this clock.
		 * @param {Number} t Time value of this clock's parent
		 * @returns {Number} corresponding time of this clock.
		 * @abstract
		 */
		ClockBase.prototype.fromParentTime = function(t) {
		    throw "Unimplemented";
		};

		/**
		 * Returns the parent of this clock, or <tt>null</tt> if it has no parent.
		 * @returns {ClockBase} parent clock, or <tt>null</tt>
		 * @abstract
		 */
		ClockBase.prototype.getParent = function() {
		    throw "Unimplemented";
		};

		/**
		 * Set/change the parent of this clock.
		 * @param {ClockBase} parent clock, or <tt>null</tt>
		 * @throws if it is not allowed to set this clock's parent.
		 * @abstract
		 * @fires change
		 */
		ClockBase.prototype.setParent = function(newParent) {
		    throw "Unimplemented";
		};

		/**
		 * Calculate the potential for difference between this clock and another clock.
		 * @param {ClockBase} otherClock The clock to compare with.
		 * @returns {Number} The potential difference in units of seconds. If effective speeds or tick rates differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
		 *
		 * If the clocks differ in effective speed or tick rate, even slightly, then
		 * this means that the clocks will eventually diverge to infinity, and so the
		 * returned difference will equal +infinity.
		 *
		 * If the clocks do not differ in effective speed or tick rate, then there will
		 * be a constant time difference between them. This is what is returned.
		 */
		ClockBase.prototype.clockDiff = function(otherClock) {
		    var thisSpeed = this.getEffectiveSpeed();
		    var otherSpeed = otherClock.getEffectiveSpeed();
		    
		    if (thisSpeed !== otherSpeed) {
		        return Number.POSITIVE_INFINITY;
		    } else if (this.getTickRate() !== otherClock.getTickRate()) {
		        return Number.POSITIVE_INFINITY;
		    } else {
		        var root = this.getRoot();
		        var t = root.now();
		        var t1 = this.fromRootTime(t);
		        var t2 = otherClock.fromRootTime(t);
		        return Math.abs(t1-t2) / this.getTickRate();
		    }
		};

		/**
		 * Calculates the dispersion (maximum error bounds) at the specified clock time.
		 * This takes into account the contribution to error of this clock and its ancestors.
		 * @param {Number} t The time position of this clock for which the dispersion is to be calculated.
		 * @returns {Number} Dispersion (in seconds) at the specified clock time.
		 */
		 ClockBase.prototype.dispersionAtTime = function(t) {
		    var disp = this._errorAtTime(t);
		    
		    var p = this.getParent();
		    if (p) {
		        var pt = this.toParentTime(t);
		        disp += p.dispersionAtTime(pt);
		    }
		    
		    return disp;
		};

		/**
		 * Calculates the error/uncertainty contribution of this clock at a given time position.
		 * 
		 * <p>It is not intended that this function is called directly. Instead, call
		 * [dispersionAtTime()]{@link ClockBase.dispersionAtTime} which uses this function
		 * as part of calculating the total dispersion.
		 *
		 * @param {Number} t A time position of this clock 
		 * @returns {Number} the potential for error (in seconds) arising from this clock
		 * at a given time of this clock. Does not include the contribution of
		 * any parent clocks.
		 *
		 * @abstract
		 */
		ClockBase.prototype._errorAtTime = function(t) {
		    throw "Unimplemented";
		};

		/**
		 * Retrieve the maximium frequency error (in ppm) of the root clock in the hierarchy. 
		 *
		 * <p>This method contains an implementation for non-root clocks only. It must
		 * be overriden for root clock implementations.
		 *
		 * @returns {Number} The maximum frequency error of the root clock (in parts per million)
		 * @abstract
		 */
		ClockBase.prototype.getRootMaxFreqError = function() {
		    var root = this.getRoot();
		    if (root === this) {
		        throw "Unimplemented";
		    } else {
		        return root.getRootMaxFreqError();
		    }
		};


		/**
		 * A callback that is called when using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
		 *
		 * @callback setTimeoutCallback
		 * @param {...*} args The parameters that were passed when the callback was scheduled.
		 * @this ClockBase
		 */

		/**
		 * Request a timeout callback when the time of this clock passes the current time plus
		 * the number of specified ticks.
		 *
		 * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
		 * rescheduled to compensate.
		 *
		 * @param {setTimeoutCallback} func  The function to callback
		 * @param {Number} ticks  The callback is triggered when the clock passes (reaches or jumps past) this number of ticks beyond the current time.
		 * @param {...*} args Other arguments are passed to the callback
		 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
		 */
		ClockBase.prototype.setTimeout = function(func, ticks) {
			arguments[1] = arguments[1] + this.now();
			return this.setAtTime.apply(this, arguments);
		};

		/**
		 * Request a timeout callback when the time of this clock passes the specified time.
		 *
		 * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
		 * rescheduled to compensate.
		 *
		 * @param {setTimeoutCallBack} func  The function to callback
		 * @param {Number} when  The callback is triggered when the clock passes (reaches or jumps past) this time.
		 * @param {...*} args Other arguments are passed to the callback
		 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
		 */
		ClockBase.prototype.setAtTime = function(func, when) {
		    var priv = PRIVATE.get(this);
		    
			var self = this;
			var handle = self.id + ":timeout-" + nextTimeoutHandle++;
			var root = self.getRoot();

			if (root === null) {
				root = self;
			}

		    // remove first two args
		    var args = new Array(arguments.length-2);
		    for(var i=2; i<arguments.length; i++) {
		        args[i-2] = arguments[i];
		    }

			var callback = function() {
				delete priv.timerHandles[handle];
				func.apply(self, args);
			}
		;
			var numRootTicks = self.toRootTime(when) - root.now();
			if (numRootTicks !== 0) {
				numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
			}
			var millis = numRootTicks * (1000 / root.getTickRate());
			var realHandle;
			if (!isNaN(millis)) {
				realHandle = setTimeout(callback, millis);
			}

			priv.timerHandles[handle] = { realHandle:realHandle, when:when, callback:callback };

			return handle;
		};


		ClockBase.prototype._rescheduleTimers = function() {
			// clock timing has changed, we need to re-schedule all timers
		    var priv = PRIVATE.get(this);

			var root = this.getRoot();

			for(var handle in priv.timerHandles) {
				if (priv.timerHandles.hasOwnProperty(handle)) {
					var d = priv.timerHandles[handle];

					// clear existing timer
					if (d.realHandle !== null && d.realHandle !== undefined) {
						clearTimeout(d.realHandle);
					}

					// re-calculate when this timer is due and re-schedule
					var numRootTicks = this.toRootTime(d.when) - root.now();
					if (numRootTicks !== 0) {
						numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
					}
					var millis = numRootTicks * (1000 / root.getTickRate());
					if (!isNaN(millis)) {
						d.realHandle = setTimeout(d.callback, Math.max(0,millis));
					} else {
						delete d.realHandle;
					}
				}
			}
		};

		/**
		 * Clear (cancel) a timer that was scheduled using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
		 *
		 * @param handle - The handle for the previously scheduled callback.
		 *
		 * If the handle does not represent a callback that was scheduled against this clock, then this method returns without doing anything.
		 */
		ClockBase.prototype.clearTimeout = function(handle) {
		    var priv = PRIVATE.get(this);

			var d = priv.timerHandles[handle];
			if (d !== undefined) {
				clearTimeout(d.realHandle);
				delete priv.timerHandles[handle];
			}
		};




		module.exports = ClockBase;


	/***/ }),
	/* 3 */
	/***/ (function(module, exports) {

		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		function EventEmitter() {
		  this._events = this._events || {};
		  this._maxListeners = this._maxListeners || undefined;
		}
		module.exports = EventEmitter;

		// Backwards-compat with node 0.10.x
		EventEmitter.EventEmitter = EventEmitter;

		EventEmitter.prototype._events = undefined;
		EventEmitter.prototype._maxListeners = undefined;

		// By default EventEmitters will print a warning if more than 10 listeners are
		// added to it. This is a useful default which helps finding memory leaks.
		EventEmitter.defaultMaxListeners = 10;

		// Obviously not all Emitters should be limited to 10. This function allows
		// that to be increased. Set to zero for unlimited.
		EventEmitter.prototype.setMaxListeners = function(n) {
		  if (!isNumber(n) || n < 0 || isNaN(n))
		    throw TypeError('n must be a positive number');
		  this._maxListeners = n;
		  return this;
		};

		EventEmitter.prototype.emit = function(type) {
		  var er, handler, len, args, i, listeners;

		  if (!this._events)
		    this._events = {};

		  // If there is no 'error' event listener then throw.
		  if (type === 'error') {
		    if (!this._events.error ||
		        (isObject(this._events.error) && !this._events.error.length)) {
		      er = arguments[1];
		      if (er instanceof Error) {
		        throw er; // Unhandled 'error' event
		      } else {
		        // At least give some kind of context to the user
		        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
		        err.context = er;
		        throw err;
		      }
		    }
		  }

		  handler = this._events[type];

		  if (isUndefined(handler))
		    return false;

		  if (isFunction(handler)) {
		    switch (arguments.length) {
		      // fast cases
		      case 1:
		        handler.call(this);
		        break;
		      case 2:
		        handler.call(this, arguments[1]);
		        break;
		      case 3:
		        handler.call(this, arguments[1], arguments[2]);
		        break;
		      // slower
		      default:
		        args = Array.prototype.slice.call(arguments, 1);
		        handler.apply(this, args);
		    }
		  } else if (isObject(handler)) {
		    args = Array.prototype.slice.call(arguments, 1);
		    listeners = handler.slice();
		    len = listeners.length;
		    for (i = 0; i < len; i++)
		      listeners[i].apply(this, args);
		  }

		  return true;
		};

		EventEmitter.prototype.addListener = function(type, listener) {
		  var m;

		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  if (!this._events)
		    this._events = {};

		  // To avoid recursion in the case that type === "newListener"! Before
		  // adding it to the listeners, first emit "newListener".
		  if (this._events.newListener)
		    this.emit('newListener', type,
		              isFunction(listener.listener) ?
		              listener.listener : listener);

		  if (!this._events[type])
		    // Optimize the case of one listener. Don't need the extra array object.
		    this._events[type] = listener;
		  else if (isObject(this._events[type]))
		    // If we've already got an array, just append.
		    this._events[type].push(listener);
		  else
		    // Adding the second element, need to change to array.
		    this._events[type] = [this._events[type], listener];

		  // Check for listener leak
		  if (isObject(this._events[type]) && !this._events[type].warned) {
		    if (!isUndefined(this._maxListeners)) {
		      m = this._maxListeners;
		    } else {
		      m = EventEmitter.defaultMaxListeners;
		    }

		    if (m && m > 0 && this._events[type].length > m) {
		      this._events[type].warned = true;
		      console.error('(node) warning: possible EventEmitter memory ' +
		                    'leak detected. %d listeners added. ' +
		                    'Use emitter.setMaxListeners() to increase limit.',
		                    this._events[type].length);
		      if (typeof console.trace === 'function') {
		        // not supported in IE 10
		        console.trace();
		      }
		    }
		  }

		  return this;
		};

		EventEmitter.prototype.on = EventEmitter.prototype.addListener;

		EventEmitter.prototype.once = function(type, listener) {
		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  var fired = false;

		  function g() {
		    this.removeListener(type, g);

		    if (!fired) {
		      fired = true;
		      listener.apply(this, arguments);
		    }
		  }

		  g.listener = listener;
		  this.on(type, g);

		  return this;
		};

		// emits a 'removeListener' event iff the listener was removed
		EventEmitter.prototype.removeListener = function(type, listener) {
		  var list, position, length, i;

		  if (!isFunction(listener))
		    throw TypeError('listener must be a function');

		  if (!this._events || !this._events[type])
		    return this;

		  list = this._events[type];
		  length = list.length;
		  position = -1;

		  if (list === listener ||
		      (isFunction(list.listener) && list.listener === listener)) {
		    delete this._events[type];
		    if (this._events.removeListener)
		      this.emit('removeListener', type, listener);

		  } else if (isObject(list)) {
		    for (i = length; i-- > 0;) {
		      if (list[i] === listener ||
		          (list[i].listener && list[i].listener === listener)) {
		        position = i;
		        break;
		      }
		    }

		    if (position < 0)
		      return this;

		    if (list.length === 1) {
		      list.length = 0;
		      delete this._events[type];
		    } else {
		      list.splice(position, 1);
		    }

		    if (this._events.removeListener)
		      this.emit('removeListener', type, listener);
		  }

		  return this;
		};

		EventEmitter.prototype.removeAllListeners = function(type) {
		  var key, listeners;

		  if (!this._events)
		    return this;

		  // not listening for removeListener, no need to emit
		  if (!this._events.removeListener) {
		    if (arguments.length === 0)
		      this._events = {};
		    else if (this._events[type])
		      delete this._events[type];
		    return this;
		  }

		  // emit removeListener for all listeners on all events
		  if (arguments.length === 0) {
		    for (key in this._events) {
		      if (key === 'removeListener') continue;
		      this.removeAllListeners(key);
		    }
		    this.removeAllListeners('removeListener');
		    this._events = {};
		    return this;
		  }

		  listeners = this._events[type];

		  if (isFunction(listeners)) {
		    this.removeListener(type, listeners);
		  } else if (listeners) {
		    // LIFO order
		    while (listeners.length)
		      this.removeListener(type, listeners[listeners.length - 1]);
		  }
		  delete this._events[type];

		  return this;
		};

		EventEmitter.prototype.listeners = function(type) {
		  var ret;
		  if (!this._events || !this._events[type])
		    ret = [];
		  else if (isFunction(this._events[type]))
		    ret = [this._events[type]];
		  else
		    ret = this._events[type].slice();
		  return ret;
		};

		EventEmitter.prototype.listenerCount = function(type) {
		  if (this._events) {
		    var evlistener = this._events[type];

		    if (isFunction(evlistener))
		      return 1;
		    else if (evlistener)
		      return evlistener.length;
		  }
		  return 0;
		};

		EventEmitter.listenerCount = function(emitter, type) {
		  return emitter.listenerCount(type);
		};

		function isFunction(arg) {
		  return typeof arg === 'function';
		}

		function isNumber(arg) {
		  return typeof arg === 'number';
		}

		function isObject(arg) {
		  return typeof arg === 'object' && arg !== null;
		}

		function isUndefined(arg) {
		  return arg === void 0;
		}


	/***/ }),
	/* 4 */
	/***/ (function(module, exports) {

		if (typeof Object.create === 'function') {
		  // implementation from standard node.js 'util' module
		  module.exports = function inherits(ctor, superCtor) {
		    ctor.super_ = superCtor
		    ctor.prototype = Object.create(superCtor.prototype, {
		      constructor: {
		        value: ctor,
		        enumerable: false,
		        writable: true,
		        configurable: true
		      }
		    });
		  };
		} else {
		  // old school shim for old browsers
		  module.exports = function inherits(ctor, superCtor) {
		    ctor.super_ = superCtor
		    var TempCtor = function () {}
		    TempCtor.prototype = superCtor.prototype
		    ctor.prototype = new TempCtor()
		    ctor.prototype.constructor = ctor
		  }
		}


	/***/ }),
	/* 5 */
	/***/ (function(module, exports) {

		// Copyright (C) 2011 Google Inc.
		//
		// Licensed under the Apache License, Version 2.0 (the "License");
		// you may not use this file except in compliance with the License.
		// You may obtain a copy of the License at
		//
		// http://www.apache.org/licenses/LICENSE-2.0
		//
		// Unless required by applicable law or agreed to in writing, software
		// distributed under the License is distributed on an "AS IS" BASIS,
		// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		// See the License for the specific language governing permissions and
		// limitations under the License.

		/**
		 * @fileoverview Install a leaky WeakMap emulation on platforms that
		 * don't provide a built-in one.
		 *
		 * <p>Assumes that an ES5 platform where, if {@code WeakMap} is
		 * already present, then it conforms to the anticipated ES6
		 * specification. To run this file on an ES5 or almost ES5
		 * implementation where the {@code WeakMap} specification does not
		 * quite conform, run <code>repairES5.js</code> first.
		 *
		 * <p>Even though WeakMapModule is not global, the linter thinks it
		 * is, which is why it is in the overrides list below.
		 *
		 * <p>NOTE: Before using this WeakMap emulation in a non-SES
		 * environment, see the note below about hiddenRecord.
		 *
		 * @author Mark S. Miller
		 * @requires crypto, ArrayBuffer, Uint8Array, navigator, console
		 * @overrides WeakMap, ses, Proxy
		 * @overrides WeakMapModule
		 */

		/**
		 * This {@code WeakMap} emulation is observably equivalent to the
		 * ES-Harmony WeakMap, but with leakier garbage collection properties.
		 *
		 * <p>As with true WeakMaps, in this emulation, a key does not
		 * retain maps indexed by that key and (crucially) a map does not
		 * retain the keys it indexes. A map by itself also does not retain
		 * the values associated with that map.
		 *
		 * <p>However, the values associated with a key in some map are
		 * retained so long as that key is retained and those associations are
		 * not overridden. For example, when used to support membranes, all
		 * values exported from a given membrane will live for the lifetime
		 * they would have had in the absence of an interposed membrane. Even
		 * when the membrane is revoked, all objects that would have been
		 * reachable in the absence of revocation will still be reachable, as
		 * far as the GC can tell, even though they will no longer be relevant
		 * to ongoing computation.
		 *
		 * <p>The API implemented here is approximately the API as implemented
		 * in FF6.0a1 and agreed to by MarkM, Andreas Gal, and Dave Herman,
		 * rather than the offially approved proposal page. TODO(erights):
		 * upgrade the ecmascript WeakMap proposal page to explain this API
		 * change and present to EcmaScript committee for their approval.
		 *
		 * <p>The first difference between the emulation here and that in
		 * FF6.0a1 is the presence of non enumerable {@code get___, has___,
		 * set___, and delete___} methods on WeakMap instances to represent
		 * what would be the hidden internal properties of a primitive
		 * implementation. Whereas the FF6.0a1 WeakMap.prototype methods
		 * require their {@code this} to be a genuine WeakMap instance (i.e.,
		 * an object of {@code [[Class]]} "WeakMap}), since there is nothing
		 * unforgeable about the pseudo-internal method names used here,
		 * nothing prevents these emulated prototype methods from being
		 * applied to non-WeakMaps with pseudo-internal methods of the same
		 * names.
		 *
		 * <p>Another difference is that our emulated {@code
		 * WeakMap.prototype} is not itself a WeakMap. A problem with the
		 * current FF6.0a1 API is that WeakMap.prototype is itself a WeakMap
		 * providing ambient mutability and an ambient communications
		 * channel. Thus, if a WeakMap is already present and has this
		 * problem, repairES5.js wraps it in a safe wrappper in order to
		 * prevent access to this channel. (See
		 * PATCH_MUTABLE_FROZEN_WEAKMAP_PROTO in repairES5.js).
		 */

		/**
		 * If this is a full <a href=
		 * "http://code.google.com/p/es-lab/wiki/SecureableES5"
		 * >secureable ES5</a> platform and the ES-Harmony {@code WeakMap} is
		 * absent, install an approximate emulation.
		 *
		 * <p>If WeakMap is present but cannot store some objects, use our approximate
		 * emulation as a wrapper.
		 *
		 * <p>If this is almost a secureable ES5 platform, then WeakMap.js
		 * should be run after repairES5.js.
		 *
		 * <p>See {@code WeakMap} for documentation of the garbage collection
		 * properties of this WeakMap emulation.
		 */
		(function WeakMapModule() {
		  "use strict";

		  if (typeof ses !== 'undefined' && ses.ok && !ses.ok()) {
		    // already too broken, so give up
		    return;
		  }

		  /**
		   * In some cases (current Firefox), we must make a choice betweeen a
		   * WeakMap which is capable of using all varieties of host objects as
		   * keys and one which is capable of safely using proxies as keys. See
		   * comments below about HostWeakMap and DoubleWeakMap for details.
		   *
		   * This function (which is a global, not exposed to guests) marks a
		   * WeakMap as permitted to do what is necessary to index all host
		   * objects, at the cost of making it unsafe for proxies.
		   *
		   * Do not apply this function to anything which is not a genuine
		   * fresh WeakMap.
		   */
		  function weakMapPermitHostObjects(map) {
		    // identity of function used as a secret -- good enough and cheap
		    if (map.permitHostObjects___) {
		      map.permitHostObjects___(weakMapPermitHostObjects);
		    }
		  }
		  if (typeof ses !== 'undefined') {
		    ses.weakMapPermitHostObjects = weakMapPermitHostObjects;
		  }

		  // IE 11 has no Proxy but has a broken WeakMap such that we need to patch
		  // it using DoubleWeakMap; this flag tells DoubleWeakMap so.
		  var doubleWeakMapCheckSilentFailure = false;

		  // Check if there is already a good-enough WeakMap implementation, and if so
		  // exit without replacing it.
		  if (typeof WeakMap === 'function') {
		    var HostWeakMap = WeakMap;
		    // There is a WeakMap -- is it good enough?
		    if (typeof navigator !== 'undefined' &&
		        /Firefox/.test(navigator.userAgent)) {
		      // We're now *assuming not*, because as of this writing (2013-05-06)
		      // Firefox's WeakMaps have a miscellany of objects they won't accept, and
		      // we don't want to make an exhaustive list, and testing for just one
		      // will be a problem if that one is fixed alone (as they did for Event).

		      // If there is a platform that we *can* reliably test on, here's how to
		      // do it:
		      //  var problematic = ... ;
		      //  var testHostMap = new HostWeakMap();
		      //  try {
		      //    testHostMap.set(problematic, 1);  // Firefox 20 will throw here
		      //    if (testHostMap.get(problematic) === 1) {
		      //      return;
		      //    }
		      //  } catch (e) {}

		    } else {
		      // IE 11 bug: WeakMaps silently fail to store frozen objects.
		      var testMap = new HostWeakMap();
		      var testObject = Object.freeze({});
		      testMap.set(testObject, 1);
		      if (testMap.get(testObject) !== 1) {
		        doubleWeakMapCheckSilentFailure = true;
		        // Fall through to installing our WeakMap.
		      } else {
		        module.exports = WeakMap;
		        return;
		      }
		    }
		  }

		  var hop = Object.prototype.hasOwnProperty;
		  var gopn = Object.getOwnPropertyNames;
		  var defProp = Object.defineProperty;
		  var isExtensible = Object.isExtensible;

		  /**
		   * Security depends on HIDDEN_NAME being both <i>unguessable</i> and
		   * <i>undiscoverable</i> by untrusted code.
		   *
		   * <p>Given the known weaknesses of Math.random() on existing
		   * browsers, it does not generate unguessability we can be confident
		   * of.
		   *
		   * <p>It is the monkey patching logic in this file that is intended
		   * to ensure undiscoverability. The basic idea is that there are
		   * three fundamental means of discovering properties of an object:
		   * The for/in loop, Object.keys(), and Object.getOwnPropertyNames(),
		   * as well as some proposed ES6 extensions that appear on our
		   * whitelist. The first two only discover enumerable properties, and
		   * we only use HIDDEN_NAME to name a non-enumerable property, so the
		   * only remaining threat should be getOwnPropertyNames and some
		   * proposed ES6 extensions that appear on our whitelist. We monkey
		   * patch them to remove HIDDEN_NAME from the list of properties they
		   * returns.
		   *
		   * <p>TODO(erights): On a platform with built-in Proxies, proxies
		   * could be used to trap and thereby discover the HIDDEN_NAME, so we
		   * need to monkey patch Proxy.create, Proxy.createFunction, etc, in
		   * order to wrap the provided handler with the real handler which
		   * filters out all traps using HIDDEN_NAME.
		   *
		   * <p>TODO(erights): Revisit Mike Stay's suggestion that we use an
		   * encapsulated function at a not-necessarily-secret name, which
		   * uses the Stiegler shared-state rights amplification pattern to
		   * reveal the associated value only to the WeakMap in which this key
		   * is associated with that value. Since only the key retains the
		   * function, the function can also remember the key without causing
		   * leakage of the key, so this doesn't violate our general gc
		   * goals. In addition, because the name need not be a guarded
		   * secret, we could efficiently handle cross-frame frozen keys.
		   */
		  var HIDDEN_NAME_PREFIX = 'weakmap:';
		  var HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'ident:' + Math.random() + '___';

		  if (typeof crypto !== 'undefined' &&
		      typeof crypto.getRandomValues === 'function' &&
		      typeof ArrayBuffer === 'function' &&
		      typeof Uint8Array === 'function') {
		    var ab = new ArrayBuffer(25);
		    var u8s = new Uint8Array(ab);
		    crypto.getRandomValues(u8s);
		    HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'rand:' +
		      Array.prototype.map.call(u8s, function(u8) {
		        return (u8 % 36).toString(36);
		      }).join('') + '___';
		  }

		  function isNotHiddenName(name) {
		    return !(
		        name.substr(0, HIDDEN_NAME_PREFIX.length) == HIDDEN_NAME_PREFIX &&
		        name.substr(name.length - 3) === '___');
		  }

		  /**
		   * Monkey patch getOwnPropertyNames to avoid revealing the
		   * HIDDEN_NAME.
		   *
		   * <p>The ES5.1 spec requires each name to appear only once, but as
		   * of this writing, this requirement is controversial for ES6, so we
		   * made this code robust against this case. If the resulting extra
		   * search turns out to be expensive, we can probably relax this once
		   * ES6 is adequately supported on all major browsers, iff no browser
		   * versions we support at that time have relaxed this constraint
		   * without providing built-in ES6 WeakMaps.
		   */
		  defProp(Object, 'getOwnPropertyNames', {
		    value: function fakeGetOwnPropertyNames(obj) {
		      return gopn(obj).filter(isNotHiddenName);
		    }
		  });

		  /**
		   * getPropertyNames is not in ES5 but it is proposed for ES6 and
		   * does appear in our whitelist, so we need to clean it too.
		   */
		  if ('getPropertyNames' in Object) {
		    var originalGetPropertyNames = Object.getPropertyNames;
		    defProp(Object, 'getPropertyNames', {
		      value: function fakeGetPropertyNames(obj) {
		        return originalGetPropertyNames(obj).filter(isNotHiddenName);
		      }
		    });
		  }

		  /**
		   * <p>To treat objects as identity-keys with reasonable efficiency
		   * on ES5 by itself (i.e., without any object-keyed collections), we
		   * need to add a hidden property to such key objects when we
		   * can. This raises several issues:
		   * <ul>
		   * <li>Arranging to add this property to objects before we lose the
		   *     chance, and
		   * <li>Hiding the existence of this new property from most
		   *     JavaScript code.
		   * <li>Preventing <i>certification theft</i>, where one object is
		   *     created falsely claiming to be the key of an association
		   *     actually keyed by another object.
		   * <li>Preventing <i>value theft</i>, where untrusted code with
		   *     access to a key object but not a weak map nevertheless
		   *     obtains access to the value associated with that key in that
		   *     weak map.
		   * </ul>
		   * We do so by
		   * <ul>
		   * <li>Making the name of the hidden property unguessable, so "[]"
		   *     indexing, which we cannot intercept, cannot be used to access
		   *     a property without knowing the name.
		   * <li>Making the hidden property non-enumerable, so we need not
		   *     worry about for-in loops or {@code Object.keys},
		   * <li>monkey patching those reflective methods that would
		   *     prevent extensions, to add this hidden property first,
		   * <li>monkey patching those methods that would reveal this
		   *     hidden property.
		   * </ul>
		   * Unfortunately, because of same-origin iframes, we cannot reliably
		   * add this hidden property before an object becomes
		   * non-extensible. Instead, if we encounter a non-extensible object
		   * without a hidden record that we can detect (whether or not it has
		   * a hidden record stored under a name secret to us), then we just
		   * use the key object itself to represent its identity in a brute
		   * force leaky map stored in the weak map, losing all the advantages
		   * of weakness for these.
		   */
		  function getHiddenRecord(key) {
		    if (key !== Object(key)) {
		      throw new TypeError('Not an object: ' + key);
		    }
		    var hiddenRecord = key[HIDDEN_NAME];
		    if (hiddenRecord && hiddenRecord.key === key) { return hiddenRecord; }
		    if (!isExtensible(key)) {
		      // Weak map must brute force, as explained in doc-comment above.
		      return void 0;
		    }

		    // The hiddenRecord and the key point directly at each other, via
		    // the "key" and HIDDEN_NAME properties respectively. The key
		    // field is for quickly verifying that this hidden record is an
		    // own property, not a hidden record from up the prototype chain.
		    //
		    // NOTE: Because this WeakMap emulation is meant only for systems like
		    // SES where Object.prototype is frozen without any numeric
		    // properties, it is ok to use an object literal for the hiddenRecord.
		    // This has two advantages:
		    // * It is much faster in a performance critical place
		    // * It avoids relying on Object.create(null), which had been
		    //   problematic on Chrome 28.0.1480.0. See
		    //   https://code.google.com/p/google-caja/issues/detail?id=1687
		    hiddenRecord = { key: key };

		    // When using this WeakMap emulation on platforms where
		    // Object.prototype might not be frozen and Object.create(null) is
		    // reliable, use the following two commented out lines instead.
		    // hiddenRecord = Object.create(null);
		    // hiddenRecord.key = key;

		    // Please contact us if you need this to work on platforms where
		    // Object.prototype might not be frozen and
		    // Object.create(null) might not be reliable.

		    try {
		      defProp(key, HIDDEN_NAME, {
		        value: hiddenRecord,
		        writable: false,
		        enumerable: false,
		        configurable: false
		      });
		      return hiddenRecord;
		    } catch (error) {
		      // Under some circumstances, isExtensible seems to misreport whether
		      // the HIDDEN_NAME can be defined.
		      // The circumstances have not been isolated, but at least affect
		      // Node.js v0.10.26 on TravisCI / Linux, but not the same version of
		      // Node.js on OS X.
		      return void 0;
		    }
		  }

		  /**
		   * Monkey patch operations that would make their argument
		   * non-extensible.
		   *
		   * <p>The monkey patched versions throw a TypeError if their
		   * argument is not an object, so it should only be done to functions
		   * that should throw a TypeError anyway if their argument is not an
		   * object.
		   */
		  (function(){
		    var oldFreeze = Object.freeze;
		    defProp(Object, 'freeze', {
		      value: function identifyingFreeze(obj) {
		        getHiddenRecord(obj);
		        return oldFreeze(obj);
		      }
		    });
		    var oldSeal = Object.seal;
		    defProp(Object, 'seal', {
		      value: function identifyingSeal(obj) {
		        getHiddenRecord(obj);
		        return oldSeal(obj);
		      }
		    });
		    var oldPreventExtensions = Object.preventExtensions;
		    defProp(Object, 'preventExtensions', {
		      value: function identifyingPreventExtensions(obj) {
		        getHiddenRecord(obj);
		        return oldPreventExtensions(obj);
		      }
		    });
		  })();

		  function constFunc(func) {
		    func.prototype = null;
		    return Object.freeze(func);
		  }

		  var calledAsFunctionWarningDone = false;
		  function calledAsFunctionWarning() {
		    // Future ES6 WeakMap is currently (2013-09-10) expected to reject WeakMap()
		    // but we used to permit it and do it ourselves, so warn only.
		    if (!calledAsFunctionWarningDone && typeof console !== 'undefined') {
		      calledAsFunctionWarningDone = true;
		      console.warn('WeakMap should be invoked as new WeakMap(), not ' +
		          'WeakMap(). This will be an error in the future.');
		    }
		  }

		  var nextId = 0;

		  var OurWeakMap = function() {
		    if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
		      calledAsFunctionWarning();
		    }

		    // We are currently (12/25/2012) never encountering any prematurely
		    // non-extensible keys.
		    var keys = []; // brute force for prematurely non-extensible keys.
		    var values = []; // brute force for corresponding values.
		    var id = nextId++;

		    function get___(key, opt_default) {
		      var index;
		      var hiddenRecord = getHiddenRecord(key);
		      if (hiddenRecord) {
		        return id in hiddenRecord ? hiddenRecord[id] : opt_default;
		      } else {
		        index = keys.indexOf(key);
		        return index >= 0 ? values[index] : opt_default;
		      }
		    }

		    function has___(key) {
		      var hiddenRecord = getHiddenRecord(key);
		      if (hiddenRecord) {
		        return id in hiddenRecord;
		      } else {
		        return keys.indexOf(key) >= 0;
		      }
		    }

		    function set___(key, value) {
		      var index;
		      var hiddenRecord = getHiddenRecord(key);
		      if (hiddenRecord) {
		        hiddenRecord[id] = value;
		      } else {
		        index = keys.indexOf(key);
		        if (index >= 0) {
		          values[index] = value;
		        } else {
		          // Since some browsers preemptively terminate slow turns but
		          // then continue computing with presumably corrupted heap
		          // state, we here defensively get keys.length first and then
		          // use it to update both the values and keys arrays, keeping
		          // them in sync.
		          index = keys.length;
		          values[index] = value;
		          // If we crash here, values will be one longer than keys.
		          keys[index] = key;
		        }
		      }
		      return this;
		    }

		    function delete___(key) {
		      var hiddenRecord = getHiddenRecord(key);
		      var index, lastIndex;
		      if (hiddenRecord) {
		        return id in hiddenRecord && delete hiddenRecord[id];
		      } else {
		        index = keys.indexOf(key);
		        if (index < 0) {
		          return false;
		        }
		        // Since some browsers preemptively terminate slow turns but
		        // then continue computing with potentially corrupted heap
		        // state, we here defensively get keys.length first and then use
		        // it to update both the keys and the values array, keeping
		        // them in sync. We update the two with an order of assignments,
		        // such that any prefix of these assignments will preserve the
		        // key/value correspondence, either before or after the delete.
		        // Note that this needs to work correctly when index === lastIndex.
		        lastIndex = keys.length - 1;
		        keys[index] = void 0;
		        // If we crash here, there's a void 0 in the keys array, but
		        // no operation will cause a "keys.indexOf(void 0)", since
		        // getHiddenRecord(void 0) will always throw an error first.
		        values[index] = values[lastIndex];
		        // If we crash here, values[index] cannot be found here,
		        // because keys[index] is void 0.
		        keys[index] = keys[lastIndex];
		        // If index === lastIndex and we crash here, then keys[index]
		        // is still void 0, since the aliasing killed the previous key.
		        keys.length = lastIndex;
		        // If we crash here, keys will be one shorter than values.
		        values.length = lastIndex;
		        return true;
		      }
		    }

		    return Object.create(OurWeakMap.prototype, {
		      get___:    { value: constFunc(get___) },
		      has___:    { value: constFunc(has___) },
		      set___:    { value: constFunc(set___) },
		      delete___: { value: constFunc(delete___) }
		    });
		  };

		  OurWeakMap.prototype = Object.create(Object.prototype, {
		    get: {
		      /**
		       * Return the value most recently associated with key, or
		       * opt_default if none.
		       */
		      value: function get(key, opt_default) {
		        return this.get___(key, opt_default);
		      },
		      writable: true,
		      configurable: true
		    },

		    has: {
		      /**
		       * Is there a value associated with key in this WeakMap?
		       */
		      value: function has(key) {
		        return this.has___(key);
		      },
		      writable: true,
		      configurable: true
		    },

		    set: {
		      /**
		       * Associate value with key in this WeakMap, overwriting any
		       * previous association if present.
		       */
		      value: function set(key, value) {
		        return this.set___(key, value);
		      },
		      writable: true,
		      configurable: true
		    },

		    'delete': {
		      /**
		       * Remove any association for key in this WeakMap, returning
		       * whether there was one.
		       *
		       * <p>Note that the boolean return here does not work like the
		       * {@code delete} operator. The {@code delete} operator returns
		       * whether the deletion succeeds at bringing about a state in
		       * which the deleted property is absent. The {@code delete}
		       * operator therefore returns true if the property was already
		       * absent, whereas this {@code delete} method returns false if
		       * the association was already absent.
		       */
		      value: function remove(key) {
		        return this.delete___(key);
		      },
		      writable: true,
		      configurable: true
		    }
		  });

		  if (typeof HostWeakMap === 'function') {
		    (function() {
		      // If we got here, then the platform has a WeakMap but we are concerned
		      // that it may refuse to store some key types. Therefore, make a map
		      // implementation which makes use of both as possible.

		      // In this mode we are always using double maps, so we are not proxy-safe.
		      // This combination does not occur in any known browser, but we had best
		      // be safe.
		      if (doubleWeakMapCheckSilentFailure && typeof Proxy !== 'undefined') {
		        Proxy = undefined;
		      }

		      function DoubleWeakMap() {
		        if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
		          calledAsFunctionWarning();
		        }

		        // Preferable, truly weak map.
		        var hmap = new HostWeakMap();

		        // Our hidden-property-based pseudo-weak-map. Lazily initialized in the
		        // 'set' implementation; thus we can avoid performing extra lookups if
		        // we know all entries actually stored are entered in 'hmap'.
		        var omap = undefined;

		        // Hidden-property maps are not compatible with proxies because proxies
		        // can observe the hidden name and either accidentally expose it or fail
		        // to allow the hidden property to be set. Therefore, we do not allow
		        // arbitrary WeakMaps to switch to using hidden properties, but only
		        // those which need the ability, and unprivileged code is not allowed
		        // to set the flag.
		        //
		        // (Except in doubleWeakMapCheckSilentFailure mode in which case we
		        // disable proxies.)
		        var enableSwitching = false;

		        function dget(key, opt_default) {
		          if (omap) {
		            return hmap.has(key) ? hmap.get(key)
		                : omap.get___(key, opt_default);
		          } else {
		            return hmap.get(key, opt_default);
		          }
		        }

		        function dhas(key) {
		          return hmap.has(key) || (omap ? omap.has___(key) : false);
		        }

		        var dset;
		        if (doubleWeakMapCheckSilentFailure) {
		          dset = function(key, value) {
		            hmap.set(key, value);
		            if (!hmap.has(key)) {
		              if (!omap) { omap = new OurWeakMap(); }
		              omap.set(key, value);
		            }
		            return this;
		          };
		        } else {
		          dset = function(key, value) {
		            if (enableSwitching) {
		              try {
		                hmap.set(key, value);
		              } catch (e) {
		                if (!omap) { omap = new OurWeakMap(); }
		                omap.set___(key, value);
		              }
		            } else {
		              hmap.set(key, value);
		            }
		            return this;
		          };
		        }

		        function ddelete(key) {
		          var result = !!hmap['delete'](key);
		          if (omap) { return omap.delete___(key) || result; }
		          return result;
		        }

		        return Object.create(OurWeakMap.prototype, {
		          get___:    { value: constFunc(dget) },
		          has___:    { value: constFunc(dhas) },
		          set___:    { value: constFunc(dset) },
		          delete___: { value: constFunc(ddelete) },
		          permitHostObjects___: { value: constFunc(function(token) {
		            if (token === weakMapPermitHostObjects) {
		              enableSwitching = true;
		            } else {
		              throw new Error('bogus call to permitHostObjects___');
		            }
		          })}
		        });
		      }
		      DoubleWeakMap.prototype = OurWeakMap.prototype;
		      module.exports = DoubleWeakMap;

		      // define .constructor to hide OurWeakMap ctor
		      Object.defineProperty(WeakMap.prototype, 'constructor', {
		        value: WeakMap,
		        enumerable: false,  // as default .constructor is
		        configurable: true,
		        writable: true
		      });
		    })();
		  } else {
		    // There is no host WeakMap, so we must use the emulation.

		    // Emulated WeakMaps are incompatible with native proxies (because proxies
		    // can observe the hidden name), so we must disable Proxy usage (in
		    // ArrayLike and Domado, currently).
		    if (typeof Proxy !== 'undefined') {
		      Proxy = undefined;
		    }

		    module.exports = OurWeakMap;
		  }
		})();


	/***/ }),
	/* 6 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		*****************************************************************************/

		var inherits = __webpack_require__(4);
		var ClockBase = __webpack_require__(2);
		var measurePrecision = __webpack_require__(7);

		var WeakMap = __webpack_require__(5);
		var PRIVATE = new WeakMap();

		var DATENOW_PRECISION = measurePrecision(Date.now.bind(Date), 100) / 1000;

		/**
		 * @exports DateNowClock
		 * @class DateNowClock
		 * @extends ClockBase
		 *
		 * @classdesc
		 * Root clock based on <tt>Date.now()</tt>.
		 * It is a subclass of {@link ClockBase}.
		 *
		 * <p>This clock can be used as the root of a hierarchy of clocks. It uses
		 * <tt>Date.now()</tt> as its underlying system clock. However this clock can
		 * be set to have its own tick rate, independent of <tt>Date.now()</tt>.
		 *
		 * <p>The precision of Date.now() is meausred when the module containing this
		 * class is first imported. The dispersion reported by this clock will always
		 * equal the measurement precision.
		 *
		 * @constructor
		 * @override
		 * @param {object} [options] Options for this clock
		 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
		 * @param {Number} [options.maxFreqErrorPpm] The maximum frequency error of the underlying clock (in ppm).
		 * @default tickRate: 1000, maxFreqErrorPpm: 50
		 *
		 * @example
		 * // milliseconds (default)
		 * root = new DateNowClock({tickRate: 1000000000 }); 
		 *
		 * // nanoseconds
		 * root = new DateNowClock({tickRate: 1000000000 });
		 *
		 * // nanoseconds, lower freq error than default
		 * root = new DateNowClock({tickRate: 1000000000, maxFreqErrorPpm: 10 }); 
		 *
		 * @abstract
		 */
		var DateNowClock = function(options) {
		    ClockBase.call(this);
		    
		    PRIVATE.set(this, {});
		    var priv = PRIVATE.get(this);

		    if (options && (typeof options.tickRate !== "undefined")) {
		        if (options.tickRate <= 0) {
		            throw "Cannot have tickrate of zero or less";
		        }
		        priv.freq = options.tickRate;
		    } else {
		        priv.freq = 1000;
		    }

		    if (options && (typeof options.maxFreqErrorPpm !== "undefined")) {
		        priv.maxFreqErrorPpm = options.maxFreqErrorPpm;
		    } else {
		        priv.maxFreqErrorPpm = 50;
		    }
		    
		    priv.precision = DATENOW_PRECISION;
		};

		inherits(DateNowClock, ClockBase);

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.now = function() {
		    return Date.now() / 1000 * PRIVATE.get(this).freq;
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.getTickRate = function() {
		    return PRIVATE.get(this).freq;
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.calcWhen = function(t) {
		    return t / PRIVATE.get(this).freq * 1000;
		};

		/**
		 * @returns {String} A human readable summary of this clock object, including its [id]{@link DateNowClock#id} and its current properties
		 * @example
		 * > c=new DateNowClock();
		 * > c.toString()
		 * 'DateNowClock({tickRate:1000, maxFreqErrorPpm:50}) [clock_0]'
		 */
		DateNowClock.prototype.toString = function() {
		    var priv = PRIVATE.get(this);
		    return "DateNowClock({tickRate:"+priv.freq+", maxFreqErrorPpm:"+priv.maxFreqErrorPpm+"}) ["+this.id+"]";
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.toParentTime = function(t) {
		    throw "Clock has no parent.";
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.fromParentTime = function(t) {
		    throw "Clock has no parent.";
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.getParent = function() {
		    return null;
		};

		/**
		 * The parent of this clock is always <tt>null</tt> and cannot be changed.
		 * @throws because this clock cannot have a parent.
		 */
		DateNowClock.prototype.setParent = function(newParent) {
		    throw "Cannot set a parent for this clock.";
		};

		/**
		 * This clock is always available, and so its [availabilityFlag]{@link DateNowClock#availabilityFlag} cannot be changed.
		 * @throws because this clock cannot have its availabilty changed.
		 */
		DateNowClock.prototype.setAvailabilityFlag = function(availability) {
		    if (!availability) {
		        throw "Cannot change availability of this clock.";
		    }
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype._errorAtTime = function(t) {
		    return PRIVATE.get(this).precision;
		};

		/**
		 * @inheritdoc
		 */
		DateNowClock.prototype.getRootMaxFreqError = function() {
		    return PRIVATE.get(this).maxFreqErrorPpm;
		};

		module.exports = DateNowClock;


	/***/ }),
	/* 7 */
	/***/ (function(module, exports) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		*****************************************************************************/

		var measurePrecision = function(timeFunc, sampleSize) {
		    var diffs = [];
		    while (diffs.length < sampleSize) {
		        var a = timeFunc();
		        var b = timeFunc();
		        if (a<b) {
		            diffs.push(b-a);
		        }
		    }
		    return Math.min.apply(this, diffs);
		};

		module.exports = measurePrecision;


	/***/ }),
	/* 8 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		 *
		 * --------------------------------------------------------------------------
		 * Summary of parts containing contributions
		 *   by British Telecommunications (BT) PLC:
		 *     CorrelatedClock.prototype.calcWhen
		 *     CorrelatedClock.prototype.toParentTime
		 *     CorrelatedClock.prototype.setParent
		 *     CorrelatedClock.prototype.quantifySignedChange
		 *     CorrelatedClock.prototype.quantifyChange
		*****************************************************************************/



		var inherits = __webpack_require__(4);
		var ClockBase = __webpack_require__(2);
		var Correlation = __webpack_require__(9);

		var WeakMap = __webpack_require__(5);
		var PRIVATE = new WeakMap();


		/**
		 * @exports CorrelatedClock
		 * @class CorrelatedClock
		 * @extends ClockBase
		 *
		 * @classdesc
		 * Clock based on a parent clock using a {@link Correlation}.
		 * It is a subclass of {@link ClockBase}.
		 *
		 * <p>The correlation determines how the time of this clock is calculated from
		 * the time of the parent clock.
		 * The correlation represents a point where a given time of the parent equates
		 * to a given time of this clock (the child clock).
		 *
		 * <p>In effect, the combination of all these factors can be though of as defining
		 * a striaght line equation with the parent clock's time on the X-axis and this
		 * clock's time on the Y-axis. The line passes through the point of correlation
		 * and the slope is dictated by the tick rates of both clocks and the speed of
		 * this clock.
		 *
		 * Speed and tick rate are then taken into account to extrapolate from that
		 * point.
		 *
		 *
		 *
		 *
		 * @constructor
		 * @override
		 * @param {ClockBase} parent The parent for this clock.
		 * @param {object} [options] Options for this clock
		 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
		 * @param {Number} [options.speed] The speed for this clock.
		 * @param {Correlation|object|Number[]} [options.correlation] Correlation for this clock as either as a Correlation object, or as an object with properties corresponding to the properties of a correlation, or as an array of values. See examples below
		 * @default tickRate: 1000, speed: 1.0, correlation: Correlation(0,0,0,0)
		 *
		 * @example
		 * root = new DateNowClock();
		 *
		 * // tickRate = 1000, correlation = (0,0)
		 * c1 = new CorrelatedClock(root);
		 *
		 * // tickRate = 25, speed=2.0, correlation = (0,0)
		 * c1 = new CorrelatedClock(root, {tickRate:25, speed:2.0});
		 *
		 * // tickRate = 1000, correlation = (10,500)
		 * c2 = new CorrelatedClock(root, { correlation: new Correlation(10,500) });
		 * c2 = new CorrelatedClock(root, { correlation: [10,500] });
		 * c2 = new CorrelatedClock(root, { correlation: {parentTime:10,childTime:500} });
		 */
		var CorrelatedClock = function(parent, options) {
		    ClockBase.call(this);

		    PRIVATE.set(this, {});
		    var priv = PRIVATE.get(this);

		    if (options && (typeof options.tickRate !== "undefined")) {
		        if (options.tickRate <= 0) {
		            throw "Cannot have tickrate of zero or less";
		        }
		        priv.freq = options.tickRate;
		    } else {
		        priv.freq = 1000;
		    }

		    if (options && (typeof options.speed !== "undefined")) {
		        priv.speed = options.speed;
		    } else {
		        priv.speed = 1.0;
		    }

		    priv.parent = parent;

		    if (options && (typeof options.correlation !== "undefined")) {
		        priv.corr = new Correlation(options.correlation);
		    } else {
		        priv.corr = new Correlation(0,0,0,0);
		    }

		    priv.parentHandlers = {
		        "change" : function(causeClock) {
		            this.emit("change", this);
		        }.bind(this),
		        "available" : this.notifyAvailabilityChange.bind(this),
		        "unavailable" : this.notifyAvailabilityChange.bind(this),
		    };

		    priv.parent = null;
		    this.setParent(parent);
		};

		inherits(CorrelatedClock, ClockBase);

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.now = function() {
		    var priv = PRIVATE.get(this);
		    var corr = priv.corr;
		    
		    if (priv.parent === null || priv.parent === undefined) {
		        return NaN
		    }

		    return corr.childTime + (priv.parent.now() - corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
		};

		/**
		 * @returns {String} A human readable summary of this clock object, including its [id]{@link CorrelatedClock#id} and its current properties
		 * @example
		 * > c=new CorrelatedClock(parent);
		 * > c.toString()
		 * 'CorrelatedClock(clock_0, {tickRate:1000, speed:1, correlation:[object Object]}) [clock_1]'
		 */
		CorrelatedClock.prototype.toString = function() {
		    var priv = PRIVATE.get(this);
		    var p;
		    if (priv.parent) {
		        p = priv.parent.id;
		    } else {
		        p = "<<no-parent>>";
		    }
		    return "CorrelatedClock("+p+", {tickRate:"+priv.freq+", speed:"+priv.speed+", correlation:"+priv.corr+"}) ["+this.id+"]";
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.getSpeed = function() {
		    return PRIVATE.get(this).speed;
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.setSpeed = function(newSpeed) {
		    var priv = PRIVATE.get(this);
		    if (priv.speed != newSpeed) {
		        priv.speed = newSpeed;
		        this.emit("change", this);
		    }
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.getTickRate = function() {
		    return PRIVATE.get(this).freq;
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.setTickRate = function(newTickRate) {
		    var priv = PRIVATE.get(this);

		    if (priv.freq != newTickRate) {
		        priv.freq = newTickRate;
		        this.emit("change", this);
		    }
		};

		CorrelatedClock.prototype.rebaseCorrelationAt = function(t) {
		    var priv = PRIVATE.get(this);

		    priv.corr = priv.corr.butWith({
		        parentTime: this.toParentTime(t),
		        childTime: t,
		        initialError: this._errorAtTime(t)
		    });
		};

		/**
		 * @var {Correlation} correlation The correlation used by this clock to define its relationship to its parent.
		 *
		 * <p>Read this property to obtain the correlation currently being used.
		 *
		 * <p>Change the correlation by setting this property to a new one. Either assign a {@link Correlation} object, or an object containing
		 * keys representing the properties of the correlation, or an Array containing the values for the correlation.
		 *
		 * <p>The underlying implementation fo this property uses the
		 * [getCorrelation]{@link ClockBase#getCorrelation} and
		 * [setCorrelation]{@link ClockBase#setCorrelation} methods.
		 *
		 * @memberof CorrelatedClock
		 * @instance
		 *
		 * @example
		 * clock = new CorrelatedClock(parentClock);
		 * clock.correlation = new Correlation(1,2);
		 * clock.correlation = [1,2];
		 * clock.correlation = { parentTime:1, childTime:2 };
		 * clock.correlation = clock.correlation.butWith({initialError:0.5, errorGrowthRate:0.1});
		 */
		Object.defineProperty(CorrelatedClock.prototype, "correlation", {
		    get: function()  { return this.getCorrelation(); },
		    set: function(v) { return this.setCorrelation(v); }
		});

		/**
		 * Retrieve the correlation for this clock.
		 * @returns {Correlation} correlation The correlation for this clock
		 */
		CorrelatedClock.prototype.getCorrelation = function() {
		    return PRIVATE.get(this).corr;
		};

		/**
		 * Set/change the correlation for this clock.
		 * @param {Correlation} newCorrelation The new correlation for this clock
		 */
		CorrelatedClock.prototype.setCorrelation = function(newCorrelation) {
		    PRIVATE.get(this).corr = new Correlation(newCorrelation);
		    this.emit("change", this);
		};

		/**
		 * Set/change the correlation and speed for this clock as a single operation.
		 *
		 * <p>Using this method instead of setting both separately only generates a single
		 * "change" event notification.
		 *
		 * @param {Correlation} newCorrelation The new correlation for this clock
		 * @param {Number} newSpeed The new speed for this clock
		 */
		CorrelatedClock.prototype.setCorrelationAndSpeed = function(newCorrelation, newSpeed) {
		    var priv = PRIVATE.get(this);

		    priv.corr = new Correlation(newCorrelation);
		    priv.speed = newSpeed;
		    this.emit("change",this);
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.calcWhen = function(t) {
		    var priv = PRIVATE.get(this);

		    return priv.parent.calcWhen(this.toParentTime(t));
		};

		/**
		 * Convert time value of this clock to the equivalent time of its parent.
		 *
		 * <p>If this clock's speed is zero (meaning that it is paused) then if <tt>t</tt>
		 * does not equal the current time of this clock, then <tt>NaN</tt> will be returned.
		 * This is because there is no equivalent time of the parent clock.
		 *
		 * @param {Number} t Time value of this clock
		 * @returns {Number} corresponding time of the parent clock or <tt>NaN</tt> if not possible when clock speed is zero.
		 * @abstract
		 */
		CorrelatedClock.prototype.toParentTime = function(t) {
		    var priv = PRIVATE.get(this);

		    if (priv.parent === null || priv.parent === undefined) {
		        return NaN;
		    } else if (priv.speed === 0) {
		        return (t === priv.corr.childTime) ? priv.corr.parentTime : NaN;
		    } else {
		        return priv.corr.parentTime + (t - priv.corr.childTime) * priv.parent.getTickRate() / priv.freq / priv.speed;
		    }
		};

		/**
		 * @inheritdoc
		 */
		ClockBase.prototype.fromParentTime = function(t) {
		    var priv = PRIVATE.get(this);
		    if (priv.parent === null || priv.parent === undefined) {
		        return NaN;
		    } else {
		        return priv.corr.childTime + (t - priv.corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
		    }
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.getParent = function() {
		    return PRIVATE.get(this).parent;
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype.setParent = function(newParent) {
		    var priv = PRIVATE.get(this);
		    var event;

		    if (priv.parent != newParent) {
		        if (priv.parent) {
		            for(event in priv.parentHandlers) {
		                priv.parent.removeListener(event, priv.parentHandlers[event]);
		            }
		        }

		        priv.parent = newParent;

		        if (priv.parent) {
		            for(event in priv.parentHandlers) {
		                priv.parent.on(event, priv.parentHandlers[event]);
		            }
		        }

		        this.emit("change", this);
		    }
		};

		/**
		 * Calculate the potential for difference in tick values of this clock if a
		 * different correlation and speed were to be used.
		 *
		 * Changes where the new time would become greater return positive values.
		 *
		 * <p>If the new speed is different, even slightly, then this means that the
		 * ticks reported by this clock will eventually differ by infinity,
		 * and so the returned value will equal ??infinity. If the speed is unchanged
		 * then the returned value reflects the difference between old and new correlations.
		 *
		 * @param {Correlation} newCorrelation A new correlation
		 * @param {Number} newSpeed A new speed
		 * @returns {Number} The potential difference in units of seconds. If speeds
		 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt> or <tt>Number.NEGATIVE_INFINITY</tt>
		 */
		CorrelatedClock.prototype.quantifySignedChange = function(newCorrelation, newSpeed) {
		    var priv = PRIVATE.get(this);
		    newCorrelation = new Correlation(newCorrelation);

		    if (newSpeed != priv.speed) {
		        return (newSpeed > priv.speed) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
		    } else {
		        var nx = newCorrelation.parentTime;
		        var nt = newCorrelation.childTime;
		        if (newSpeed !== 0) {
		            var ox = this.toParentTime(nt);
		            return (nx-ox) / priv.parent.getTickRate();
		        } else {
		            var ot = this.fromParentTime(nx);
		            return (nt-ot) / priv.freq;
		        }
		    }
		};

		/**
		 * Calculate the absolute value of the potential for difference in tick values of this
		 * clock if a different correlation and speed were to be used.
		 *
		 * <p>If the new speed is different, even slightly, then this means that the
		 * ticks reported by this clock will eventually differ by infinity,
		 * and so the returned value will equal +infinity. If the speed is unchanged
		 * then the returned value reflects the difference between old and new correlations.
		 *
		 * @param {Correlation} newCorrelation A new correlation
		 * @param {Number} newSpeed A new speed
		 * @returns {Number} The potential difference in units of seconds. If speeds
		 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
		 */
		CorrelatedClock.prototype.quantifyChange = function(newCorrelation, newSpeed) {
		    return Math.abs(this.quantifySignedChange(newCorrelation, newSpeed));
		};

		/**
		 * Returns True if the potential for difference in tick values of this clock
		 * (using a new correlation and speed) exceeds a specified threshold.
		 *
		 * <p>This is implemented by applying a threshold to the output of
		 * [quantifyChange()]{@link CorrelatedClock#quantifyChange}.
		 *
		 * @param {Correlation} newCorrelation A new correlation
		 * @param {Number} newSpeed A new speed
		 * @returns {Boolean} True if the potential difference can/will eventually exceed the threshold.
		 */
		CorrelatedClock.prototype.isChangeSignificant = function(newCorrelation, newSpeed, thresholdSecs) {
		    var delta = this.quantifyChange(newCorrelation, newSpeed);
		    return delta > thresholdSecs;
		};

		/**
		 * @inheritdoc
		 */
		CorrelatedClock.prototype._errorAtTime = function(t) {
		    var priv = PRIVATE.get(this);

		    var pt = this.toParentTime(t);
		    var deltaSecs = Math.abs(pt - priv.corr.parentTime) / priv.parent.getTickRate();
		    return priv.corr.initialError + deltaSecs * priv.corr.errorGrowthRate;
		};

		module.exports = CorrelatedClock;


	/***/ }),
	/* 9 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		*****************************************************************************/

		var WeakMap = __webpack_require__(5);
		var PRIVATE = new WeakMap();


		/**
		 * @exports Correlation
		 * @class Correlation
		 *
		 * @classdesc
		 * This is an immutable object representing a correlation.
		 * It also can represent associated error/uncertaint information.
		 *
		 * <p>The point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}) represents a relationship between
		 * a parent clock and a child clock - by saying that the parent clock
		 * is at point [parentTime]{@link Correlation#parentTime} when the child clock is at point [childTime]{@link Correlation#childTime}.
		 *
		 * <p>Error information is represented as an [initialError]{@link Correlation#initialError} amount and a
		 * [errorGrowthRate]{@link Correlation#errorGrowthRate}. The initial amount of error represents the amount
		 * of uncertainty at the point of the correlation; and the growth rate represents
		 * how much uncertainty increases by as you move further away from the point
		 * of correlation. Both are in units of seconds, and seconds per second, of
		 * the child clock. By default these are set to zero, so there is assumed to
		 * be no error.
		 *
		 * <p>The properties of the correlation can be read:
		 * <pre class="prettyprint"><code>
		 * corr = new Correlation(10, 20, 0.5, 0.1);
		 * p = corr.parentTime;
		 * t = corr.childTime;
		 * i = corr.initialError;
		 * g = corr.errorGrowthRate;
		 * </code></pre>
		 *
		 * <p>However the object is immutable. The properties cannot be set. Instead use
		 * the butWith() method to create a new correlation "but with" some properties
		 * changed:
		 * <pre class="prettyprint"><code>
		 * corr = new Correlation(10, 20, 0.5, 0.1);
		 * corr2= corr.butWith({parentTime: 11, childTime:19})
		 * </code></pre>
		 *
		 * @constructor
		 * @param {Number|object|Number[]} parentTimeOrObject - The parent time, or the whole correlation expressed as an object, or an array with the arguments in this order.
		 * @param {Number} [parentTimeOrObject.parentTime] The parent time
		 * @param {Number} [parentTimeOrObject.childTime] The child time.
		 * @param {Number} [parentTimeOrObject.initialError] The initial error (in seconds)
		 * @param {Number} [parentTimeOrObject.errorGrowthRate] The error growth rate (in seconds per second.)
		 * @param {Number} [childTime] The child time.
		 * @param {Number} [initialError] The initial error (in seconds)
		 * @param {Number} [errorGrowthRate] The error growth rate (in seconds per second.)
		 *
		 * @example
		 * // parentTime = 10, childTime=20, initialError=0, errorGrowthRate=0
		 * c = new Correlation(10, 20);
		 * @example
		 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
		 * c = new Correlation(10, 20, 0.5, 0.1);
		 * @example
		 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
		 * c = new Correlation([10, 20, 0.5, 0.1])
		 * @example
		 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
		 * c = new Correlation({parentTime:10, childTime:20, initialError:0.5, errorGrowthRate:0.1])
		 */
		var Correlation = function(parentTimeOrObject, childTime, initialError, errorGrowthRate) {
		    PRIVATE.set(this, {});

		    var priv = PRIVATE.get(this);

		    var parentTime;

		    if (Array.isArray(parentTimeOrObject)) {
		        parentTime = parentTimeOrObject[0];
		        childTime = parentTimeOrObject[1];
		        initialError = parentTimeOrObject[2];
		        errorGrowthRate = parentTimeOrObject[3];
		    } else if (typeof parentTimeOrObject === "object") {
		        parentTime = parentTimeOrObject.parentTime;
		        childTime = parentTimeOrObject.childTime;
		        initialError = parentTimeOrObject.initialError;
		        errorGrowthRate = parentTimeOrObject.errorGrowthRate;
		    } else {
		        parentTime = parentTimeOrObject;
		    }

		    priv.parentTime = (typeof parentTime !== "undefined") ? parentTime : 0;
		    priv.childTime  = (typeof childTime !== "undefined")  ? childTime  : 0;

		    priv.initialError    = (typeof initialError !== "undefined")    ? initialError    : 0;
		    priv.errorGrowthRate = (typeof errorGrowthRate !== "undefined") ? errorGrowthRate : 0;
		};

		/**
		 * Build a new correlation object, but with the properties changed listed as
		 * named properties of the object passed.
		 *
		 * @param {object} changes An object where the property names and values represent the properties of the correlation to be changed.
		 * @param {Number} [changes.parentTime] The parent time
		 * @param {Number} [changes.childTime] The child time.
		 * @param {Number} [changes.initialError] The initial error (in seconds)
		 * @param {Number} [changes.errorGrowthRate] The error growth rate (in seconds per second.)
		 *
		 * @returns {Correlation} new Correlation object that is the same as this one, but with the specified changes.
		 *
		 * @example
		 * var corr = new Correlation(1,2);
		 * var corr2 = corr.butWith({parentTime:5});
		 * console.log(corr.parentTime, corr.childTime); // 5 2
		 */
		Correlation.prototype.butWith = function(changes) {
		    var priv = PRIVATE.get(this);

		    if (typeof changes === "undefined") {
		        return this;
		    } else {
		        var p = changes.parentTime;
		        var c = changes.childTime;
		        var i = changes.initialError;
		        var g = changes.errorGrowthRate;

		        if (typeof p === "undefined") { p = priv.parentTime; }
		        if (typeof c === "undefined") { c = priv.childTime; }
		        if (typeof i === "undefined") { i = priv.initialError; }
		        if (typeof g === "undefined") { g = priv.errorGrowthRate; }

		        return new Correlation(p,c,i,g);
		    }
		};

		/**
		 * @var {Number} parentTime Parent Time. Along with the [childTime]{@link Correlation#childTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
		 * @memberof Correlation
		 * @instance
		 */

		Object.defineProperty(Correlation.prototype, "parentTime", {
		    get: function()  { return PRIVATE.get(this).parentTime; },
		    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
		});

		/**
		 * @var {Number} childTime Child Time. Along with the [parentTime]{@link Correlation#parentTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
		 * @memberof Correlation
		 * @instance
		 */

		Object.defineProperty(Correlation.prototype, "childTime", {
		    get: function()  { return PRIVATE.get(this).childTime; },
		    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
		});

		/**
		 * @var {Number} initialError The intial amount of error/uncertainly (in seconds) at the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
		 * @memberof Correlation
		 * @instance
		 */

		Object.defineProperty(Correlation.prototype, "initialError", {
		    get: function()  { return PRIVATE.get(this).initialError; },
		    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
		});

		/**
		 * @var {Number} errorGrowthRate The amonut by which error/uncertainly will grown (in seconds) for every second of child clock time away from the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
		 * @memberof Correlation
		 * @instance
		 */

		Object.defineProperty(Correlation.prototype, "errorGrowthRate", {
		    get: function()  { return PRIVATE.get(this).errorGrowthRate; },
		    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
		});

		/**
		 * Compare this correlation with another to check if they are the same.
		 * @param {Correlation} obj - another correlation to compare with.
		 * @returns {boolean} True if this correlation represents the same correlation and error/uncertainty as the one provided.
		 */
		Correlation.prototype.equals = function(obj) {
		    var priv = PRIVATE.get(this);
		    return priv.parentTime === obj.parentTime &&
		        priv.childTime === obj.childTime &&
		        priv.initialError === obj.initialError &&
		        priv.errorGrowthRate === obj.errorGrowthRate;
		};

		Correlation.prototype.toJSON = function() {
		  var priv = PRIVATE.get(this);

		  return JSON.stringify(
		    {
		      parentTime : priv.parentTime,
		      childTime : priv.childTime,
		      initialError : priv.initialError,
		      errorGrowthRate : priv.errorGrowthRate
		    }
		  );
		};


		module.exports = Correlation;


	/***/ }),
	/* 10 */
	/***/ (function(module, exports, __webpack_require__) {

		/****************************************************************************
		 * Copyright 2017 British Broadcasting Corporation
		 * 
		 * Licensed under the Apache License, Version 2.0 (the "License");
		 * you may not use this file except in compliance with the License.
		 * You may obtain a copy of the License at
		 * 
		 *     http://www.apache.org/licenses/LICENSE-2.0
		 * 
		 * Unless required by applicable law or agreed to in writing, software
		 * distributed under the License is distributed on an "AS IS" BASIS,
		 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		 * See the License for the specific language governing permissions and
		 * limitations under the License.
		*****************************************************************************/
		 
		var inherits = __webpack_require__(4);
		var ClockBase = __webpack_require__(2);

		var WeakMap = __webpack_require__(5);
		var PRIVATE = new WeakMap();


		/**
		 * @exports OffsetClock
		 * @class OffsetClock
		 * @extends ClockBase
		 *
		 * @classdesc
		 * A clock that applies an offset such that reading it is the same as
		 * reading its parent, but as if the current time is slightly offset by an
		 * amount ahead (+ve offset) or behind (-ve offset). 
		 * It is a subclass of {@link ClockBase}.
		 * 
		 * <p><tt>OffsetClock</tt> inherits the tick rate of its parent. Its speed is
		 * always 1. It takes the effective speed into account when applying the offset,
		 * so it should always represent the same amount of time according to the root
		 * clock. In practice this means it will be a constant offset amount of real-world
		 * time.
		 * 
		 * <p>This can be used to compensate for rendering delays. If it takes N seconds
		 * to render some content and display it, then a positive offset of N seconds
		 * will mean that the rendering code thinks time is N seconds ahead of where
		 * it is. It will then render the correct content that is needed to be displayed
		 * in N seconds time.
		 * 
		 * <p>For example: A correlated clock (the "media clock") represents the time
		 * position a video player needs to currently be at.
		 * 
		 * <p>The video player has a 40 milisecond (0.040 second) delay between when it renders a frame and the light being emitted by the display. We therefore need the
		 * video player to render 40 milliseconds in advance of when the frame is
		 * to be displayed. An :class:`OffsetClock` is used to offset time in this
		 * way and is passed to the video player:
		 * 
		 * <pre class="prettyprint"><code>
		 * mediaClock = new CorrelatedClock(...);
		 *     
		 * PLAYER_DELAY_SECS = 40;
		 * oClock = new OffsetClock(mediaClock, {offset:PLAYER_DELAY_SECS});
		 *     
		 * videoPlayer.syncToClock(oClock);
		 * </code></pre>
		 *     
		 * <p>If needed, the offset can be altered at runtime, by setting the :data:`offset`
		 * property. For example, perhaps it needs to be changed to a 50 millisecond offset:
		 * 
		 * <pre class="prettyprint"><code>
		 * oClock.offset = 50;
		 * </code></pre>
		 * 
		 * <p>Both positive and negative offsets can be used. 
		 */
		var OffsetClock = function(parent, options) {
		    ClockBase.call(this);
		    
		    PRIVATE.set(this, {});
		    var priv = PRIVATE.get(this);

		    if (options && (typeof options.offset !== "undefined")) {
		        if (typeof options.offset === "number") {
		            priv.offset = options.offset;
		        } else {
		            throw "'offset' option must be a number (in milliseconds)";
		        }
		    } else {
		        priv.offset = 0;
		    }
		    
		    priv.parent = parent;
		    
		    priv.parentHandlers = {
		        "change" : function(causeClock) {
		            this.emit("change", this);
		        }.bind(this),
		        "available" : this.notifyAvailabilityChange.bind(this),
		        "unavailable" : this.notifyAvailabilityChange.bind(this),
		    };

		    priv.parent = null;
		    this.setParent(parent);    
		};

		inherits(OffsetClock, ClockBase);

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.now = function() {
		    var priv = PRIVATE.get(this);
		    
		    return priv.parent.now() + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
		};

		/**
		 * @returns {String} A human readable summary of this clock object, including its current properties
		 * @example
		 * > c=new Offset(parent, {offset:20});
		 * > c.toString()
		 * 'OffsetClock(clock_0, {offset:20}) [clock_1]'
		 */
		OffsetClock.prototype.toString = function() {
		    var priv = PRIVATE.get(this);
		    var p;
		    if (priv.parent) {
		        p = priv.parent.id;
		    } else {
		        p = "<<no-parent>>";
		    }
		    return "OffsetClock("+p+", {offset:"+priv.offset+"}) ["+this.id+"]";
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.getSpeed = function() {
		    return 1;
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.setSpeed = function(newSpeed) {
		    throw "Cannot change the speed of this clock.";
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.getTickRate = function() {
		    return PRIVATE.get(this).parent.tickRate;
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.setTickRate = function(newTickRate) {
		    throw "Cannot change the tick rate of this clock.";
		};

		/**
		 * @var {Number} offset The amount by which this clock should be in advance, in milliseconds in terms of elapsed root clock time.
		 *
		 * <p>The underlying implementation of this property uses the
		 * [getOffset]{@link OffsetClock#getOffset} and
		 * [setOffset]{@link OffsetClock#setOffset} methods.
		 * @default 1.0
		 * @memberof OffsetClock
		 * @instance
		 * @fires change
		 */
		Object.defineProperty(OffsetClock.prototype, "offset", {
		    get: function() { return this.getOffset(); },
		    set: function(millis) { return this.setOffset(millis); },
		});

		/**
		 * Read the number of milliseconds by which this clock is ahead (the offset).
		 *
		 * The offset is in terms of elapsed root clock time, not elapsed time of
		 * the parent.
		 *
		 * @return {Number} The number of milliseconds by which this clock is ahead.
		 */
		OffsetClock.prototype.getOffset = function() {
		    return PRIVATE.get(this).offset;
		};

		/**
		 * Change the number of milliseconds by which this clock is ahead (the offset)
		 *
		 * The offset is in terms of elapsed root clock time, not elapsed time of
		 * the parent.
		 *
		 * @param {Number} millis The number of milliseconds by which this clock is ahead.
		 */
		OffsetClock.prototype.setOffset = function(millis) {
		    var priv = PRIVATE.get(this);
		    var changed = millis != priv.offset;
		    priv.offset = millis;
		    if (changed) {
		        this.emit("change", this);
		    }
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.calcWhen = function(t) {
		    var priv = PRIVATE.get(this);
		    
		    var tt = t + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
		    return priv.parent.calcWhen(this.toParentTime(tt));
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.getParent = function() {
		    return PRIVATE.get(this).parent;
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.setParent = function(newParent) {
		    var priv = PRIVATE.get(this);
		    var event;
		    
		    if (priv.parent != newParent) {
		        if (priv.parent) {
		            for(event in priv.parentHandlers) {
		                priv.parent.removeListener(event, priv.parentHandlers[event]);
		            }
		        }

		        priv.parent = newParent;

		        if (priv.parent) {
		            for(event in priv.parentHandlers) {
		                priv.parent.on(event, priv.parentHandlers[event]);
		            }
		        }
		        
		        this.emit("change", this);
		    }
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.toParentTime = function(t) {
		    var priv = PRIVATE.get(this);
		    return t - priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
		};

		/**
		 * @inheritdoc
		 */
		OffsetClock.prototype.fromParentTime = function(t) {
		    var priv = PRIVATE.get(this);
		    return t + priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
		};

		module.exports = OffsetClock;


	/***/ })
	/******/ ])
	});
	;

/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var WallClockMessage = __webpack_require__(218);

	Math.log2 = Math.log2 || function(x) {
	  return Math.log(x) / Math.LN2;
	};

	Math.trunc = Math.trunc || function(x) {
	  return x < 0 ? Math.ceil(x) : Math.floor(x);
	}

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * BinarySerialiser message serialiser/deserialiser for Wall Clock protocol messages.
	 * The binary format is that defined in ETSI TS 103 286-2 clause 8
	 * (the wall clock protocol message format).
	 *
	 * @implements {ProtocolSerialiser}
	 */
	var BinarySerialiser = {
	    /**
	     * Serialise an object representing a Wall Clock protocol message ready for transmission on the wire
	     * @param {WallClockMessage} wcMsg Object representing Wall Clock protocol message.
	     * @returns {ArrayBuffer} The serialsed message.
	     */
	    pack: function(wcMsg) {
	        if (wcMsg.version != 0) { throw "Invalid message version"; }

	        // create the UDP message to send
	        var udpMsg = new Uint8Array(32);
	        var d = new DataView(udpMsg.buffer);

	        d.setUint8(0, wcMsg.version);
	        d.setUint8(1, wcMsg.type);
	        d.setUint8(2, Math.ceil(Math.log2(wcMsg.precision)));
	        d.setUint8(3, 0);  // reserved bits

	        d.setUint32( 4, wcMsg.max_freq_error*256);

	        d.setUint32( 8, wcMsg.originate_timevalue_secs);
	        d.setUint32(12, wcMsg.originate_timevalue_nanos);

	        var t2 = WallClockMessage.nanosToSecsAndNanos(wcMsg.receive_timevalue);
	        d.setUint32(16, t2[0]);
	        d.setUint32(20, t2[1]);

	        var t3 = WallClockMessage.nanosToSecsAndNanos(wcMsg.transmit_timevalue);
	        d.setUint32(24, t3[0]);
	        d.setUint32(28, t3[1]);

	        return udpMsg.buffer;
	    },

	    /**
	     * Deserialise a received Wall Clock protocol message into an object representing it
	     * @param {ArrayBuffer} wcMsg The received serialsed message.
	     * @returns {WallClockMessage} Object representing the Wall Clock protocol message.
	     */
	    unpack: function(msg) {
	        var data = new DataView(msg)

	        var version = data.getUint8(0);
	        if (version != 0) { throw "Invalid message version"; }

	        return new WallClockMessage(
	            version,
	            data.getUint8(1),
	            Math.pow(2, data.getInt8(2)), // seconds
	            data.getUint32(4) / 256, // ppm
	            data.getUint32(8),
	            data.getUint32(12),
	            data.getUint32(16) + data.getUint32(20) / 1000000000,
	            data.getUint32(24) + data.getUint32(28) / 1000000000
	        );
	    },
	    toHex: function(buffer)
	    {
	       if (buffer instanceof ArrayBuffer){


	           // create a byte array (Uint8Array) that we can use to read the array buffer
	           const byteArray = new Uint8Array(buffer);

	           // for each element, we want to get its two-digit hexadecimal representation
	           const hexParts = [];
	           for(var i = 0; i < byteArray.length; i++) {
	               // convert value to hexadecimal
	               const hex = byteArray[i].toString(16);

	               // pad with zeros to length 2
	               const paddedHex = ('00' + hex).slice(-2);

	               // push to array
	               hexParts.push(paddedHex);
	           }

	           // join all the hex values of the elements into a single string
	           return hexParts.join('');
	      }
	    }
	};

	module.exports = BinarySerialiser;


/***/ }),
/* 222 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var WebSocketAdaptor = __webpack_require__(216);
	var WallClockClientProtocol = __webpack_require__(217);
	var JsonSerialiser = __webpack_require__(223);

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * Factory function that creates a Wall Clock client that uses a WebSocket
	 * and sends/receives protocol messages in JSON format.
	 *
	 * @param {WebSocket} webSocket A W3C WebSockets API comaptible websocket connection object
	 * @param {CorrelatedClock} wallClock
	 * @param {Object} clientOptions
	 * @returns {dvbcss-protocols.SocketAdaptors.WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
	 */
	var createJsonWebSocketClient = function(webSocket, wallClock, clientOptions) {
	    return new WebSocketAdaptor(
	        new WallClockClientProtocol(
	            wallClock,
	            JsonSerialiser,
	            clientOptions
	        ),
	        webSocket);
	};


	module.exports = createJsonWebSocketClient;


/***/ }),
/* 223 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var WallClockMessage = __webpack_require__(218);

	/**
	 * @memberof dvbcss-protocols.WallClock
	 * @description
	 * JsonSerialiser message serialiser/deserialiser for Wall Clock protocol messages
	 * 
	 * @implements {ProtocolSerialiser}
	 */
	var JsonSerialiser = {
	    /**
	     * Serialise an object representing a Wall Clock protocol message ready for transmission on the wire
	     * @param {WallClockMessage} wcMsg Object representing Wall Clock protocol message.
	     * @returns {String} The serialsed message.
	     */
	    pack: function(wcMsg) {

	        if (wcMsg.version != 0) { throw "Invalid message version"; }
	        
	        return JSON.stringify({
	            v:    Number(wcMsg.version),
	            t:    Number(wcMsg.type),
	            p:    Number(wcMsg.precision),
	            mfe:  Number(wcMsg.max_freq_error),
	            otvs: Number(wcMsg.originate_timevalue_secs),
	            otvn: Number(wcMsg.originate_timevalue_nanos),
	            rt:   Number(wcMsg.receive_timevalue),
	            tt:   Number(wcMsg.transmit_timevalue)
	        });
	    },
	    
	    /**
	     * Deserialise a received Wall Clock protocol message into an object representing it
	     * @param {String|ArrayBuffer} wcMsg The received serialsed message.
	     * @returns {WallClockMessage} Object representing the Wall Clock protocol message.
	     */
	    unpack: function(jsonMsg) {
	        // coerce from arraybuffer,if needed
	        if (jsonMsg instanceof ArrayBuffer) {
	            jsonMsg = String.fromCharCode.apply(null, new Uint8Array(jsonMsg));
	        }

	        var parsedMsg = JSON.parse(jsonMsg);

	        if (parsedMsg.v != 0) { throw "Invalid message version"; }

	        return new WallClockMessage(
	            parseInt(parsedMsg.v),
	            parseInt(parsedMsg.t),
	            Number(parsedMsg.p),
	            Number(parsedMsg.mfe),
	            parseInt(parsedMsg.otvs),
	            parseInt(parsedMsg.otvn),
	            Number(parsedMsg.rt),
	            Number(parsedMsg.tt)
	        );
	    }
	};

	module.exports = JsonSerialiser;


/***/ }),
/* 224 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 Institut f??r Rundfunktechnik
	 * and contributions Copyright 2017 British Broadcasting Corporation.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Broadcasting Corporation (BBC):
	 *     PresentationTimestamps.deserialise : arraybuffer coercion
	*****************************************************************************/

	var PresentationTimestamp = __webpack_require__(225);

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @class
	 * @description
	 * Object representing actual, earliest and latest presentation timestamps sent from a synchronistion client to the MSAS.
	 *
	 * @constructor
	 * @param {PresentationTimestamp} actual optional timestamp, representing the actual presentation on the client
	 * @param {PresentationTimestamp} earliest timestamp indicating when the client can present a media sample at the very earliest
	 * @param {PresentationTimestamp} latest timestamp indicating when the client can present a media sample at the very latest
	 */

	var PresentationTimestamps = function(earliest, latest, actual) {
	  this.earliest   = earliest;
	  this.latest     = latest;
	  this.actual     = actual;

	  if (!(this.earliest instanceof PresentationTimestamp && this.latest instanceof PresentationTimestamp &&
	     (this.actual instanceof PresentationTimestamp || this.actual !== undefined)))
	  {
	    throw ("PresentationTimestamps(): Invalid parameters.");
	  }
	}

	/**
	 * @returns {string} string representation of the PresentationTimestamps as defined by ETSI TS XXX XXX clause 5.7.4
	 */
	PresentationTimestamps.prototype.serialise = function () {
	  return JSON.stringify(this);
	}

	/**
	 * @returns {PresentationTimestamps} actual, earliest and latest presentation timestamps from a JSON formatted string
	 */
	PresentationTimestamps.deserialise = function (jsonVal) {
	    // coerce from arraybuffer,if needed
	    if (jsonVal instanceof ArrayBuffer) {
	        jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal));
	    }
	  var o = JSON.parse(jsonVal);

	  return new PresentationTimestamps (
	    PresentationTimestamp.getFromObj(o.earliest),
	    PresentationTimestamp.getFromObj(o.latest),
	    o.actual ? PresentationTimestamp.getFromObj(o.actual) : undefined
	  );
	}

	module.exports = PresentationTimestamps;


/***/ }),
/* 225 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 Institut f??r Rundfunktechnik
	 * and contributions Copyright 2017 British Broadcasting Corporation.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Broadcasting Corporation (BBC):
	 *     PresentationTimestamp.prototype.equals
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @class
	 * @description
	 * Object representing a presentation timestamp to correlate media timelines with wall clock times.
	 *
	 * @constructor
	 * @param {Number} contentTime   if known a positive integer, null otherwise
	 * @param {Number} wallClockTime a value on the wallclock, as a positive integer
	 */

	var PresentationTimestamp = function(contentTime, wallClockTime) {
	  this.contentTime   = Number(contentTime).toString();
	  this.wallClockTime = Number(wallClockTime).toString();

	  if (isNaN(this.contentTime) || isNaN(this.wallClockTime))
	  {
	    throw "PresentationTimestamp(): Invalid parameters: not a number.";
	  }
	}

	/**
	 * Method intended to be called from PresentationTimestamps.deserialise
	 * @returns {PresentationTimestamp} translates an object into a PresentationTimestamp.
	 */
	PresentationTimestamp.getFromObj = function (o) {
	  return new PresentationTimestamp(o.contentTime, o.wallClockTime);
	}

	/**
	 * Compare this PresentationTimestamp with another to check if they are the same.
	 * @param {PresentationTimestamp} obj - another PresentationTimestamp to compare with.
	 * @returns {boolean} True if this PresentationTimestamp represents the same PresentationTimestamp as the one provided.
	 */
	PresentationTimestamp.prototype.equals = function(obj) {

	    return this.contentTime === obj.contentTime &&
	        this.wallClockTime === obj.wallClockTime;
	};


	module.exports = PresentationTimestamp;


/***/ }),
/* 226 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 Institut f??r Rundfunktechnik
	 * and contributions Copyright 2017 British Broadcasting Corporation.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Broadcasting Corporation (BBC):
	 *     ControlTimestamp.prototype.toJson
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @class
	 * @description
	 * Object representing a control timestamp to correlate media timelines with wall clock times.
	 *
	 * @constructor
	 * @param {Number} contentTime if known a positive integer, null otherwise
	 * @param {Number} wallClockTime a value on the wallclock, as a positive integer
	 * @param {Number} timelineSpeedMultiplier if known a floating point number, null otherwise
	 *
	 * @implements {Serialisable}
	 */

	var ControlTimestamp = function(contentTime, wallClockTime, timelineSpeedMultiplier) {
	  this.contentTime = (contentTime !== null) ? Number(contentTime) : null;
	  this.wallClockTime = Number(wallClockTime);
	  this.timelineSpeedMultiplier = (timelineSpeedMultiplier !== null) ? Number(timelineSpeedMultiplier) : null;

	  if (!((Number.NaN !== this.contentTime && Number.NaN !== this.timelineSpeedMultiplier) ||
	        (this.contentTime === null && this.timelineSpeedMultiplier === null)) &&
	        (Number.isInteger(this.wallClockTime)))
	  {
	    throw "Invalid parameters";
	  }
	}

	/**
	 * @return a string representation of this ControlTimestamp as defined by ETSI TS 103 286 clause 5.7.5
	 */
	ControlTimestamp.prototype.serialise = function () {
	  return JSON.stringify(
	    {
	      contentTime : this.contentTime.toString(),
	      wallClockTime : this.wallClockTime.toString(),
	      timelineSpeedMultiplier : this.timelineSpeedMultiplier
	    }
	  );
	}

	/**
	  @returns {ControlTimestamp} Creates a ControlTimestamp from a JSON formatted string as defined by ETSI TS 103 286 clause 5.7.5
	*/
	ControlTimestamp.deserialise = function (jsonVal) {
	    // coerce from arraybuffer,if needed
	    if (jsonVal instanceof ArrayBuffer) {
	        jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal));
	    }

	  var o = JSON.parse(jsonVal);

	  return new ControlTimestamp(
	      o.contentTime,
	      o.wallClockTime,
	      o.timelineSpeedMultiplier
	  );
	}

	ControlTimestamp.prototype.toJson = function() {
	  return this.serialise.call(this);
	};

	module.exports = ControlTimestamp;


/***/ }),
/* 227 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 Institut f??r Rundfunktechnik
	 * and contributions Copyright 2017 British Broadcasting Corporation.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Broadcasting Corporation (BBC):
	 *     TSSetupMessage.deserialise : arraybuffer coercion
	*****************************************************************************/

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @class
	 * @description
	 * Object representing the setup message for the timeline synchronistation protocol that is sent from the client to the server initially. See ETSI TS XXX
	 *
	 * @constructor
	 * @param {string} contentIdStem is a string value consisting of a CI stem.
	 * @param {string} timelineSelector is a string value consisting of a URI that indicates which Synchronisation Timeline is to be used for Timestamps.
	 */

	function TSSetupMessage (contentIdStem, timelineSelector) {
	  this.contentIdStem = contentIdStem;
	  this.timelineSelector = timelineSelector;

	  if (typeof contentIdStem !== "string" || typeof timelineSelector !== "string") {
	    throw "TSSetupMessage(): Invalid parameters.";
	  }
	};

	TSSetupMessage.prototype.serialise = function () {
	  return JSON.stringify(this);
	};

	TSSetupMessage.deserialise = function (jsonVal) {
	    // coerce from arraybuffer,if needed
	    if (jsonVal instanceof ArrayBuffer) {
	        jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal));
	    }
	  var o = JSON.parse(jsonVal);

	  return new TSSetupMessage (o.contentIdStem, o.timelineSelector);
	};

	module.exports = TSSetupMessage;


/***/ }),
/* 228 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 Institut f??r Rundfunktechnik
	 * and contributions Copyright 2017 British Broadcasting Corporation.
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 * --------------------------------------------------------------------------
	 * Summary of parts containing contributions
	 *   by British Broadcasting Corporation (BBC):
	 *     TSClientProtocol.prototype.handleMessage :
	 *         availablility and change significance checks
	*****************************************************************************/

	var events = __webpack_require__(3);
	var inherits = __webpack_require__(2);

	var TSSetupMessage         = __webpack_require__(227);
	var ControlTimestamp       = __webpack_require__(226);
	var PresentationTimestamp  = __webpack_require__(225);
	var PresentationTimestamps = __webpack_require__(224);

	var clocks          = __webpack_require__(220);
	var Correlation     = clocks.Correlation;
	var CorrelatedClock = clocks.CorrelatedClock;

	var WeakMap = (typeof window !== "undefined" && window.WeakMap) || __webpack_require__(4);
	var PRIVATE = new WeakMap();

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @class
	 * @description Implementation of the client part of the timeline synchroniation protocol as defined in DVB CSS.
	   With start() the protocol is initiated. The CorrelatedClock object passed into the constructor is updated with ControlTimestamps
	   send by the server (MSAS).
	 *
	 * @implements ProtocolHandler
	 *
	 * @constructor
	 * @param {CorrelatedClock} syncTLClock The clock to represent the timeline. It will be updated according to the timestamp messages received.
	 * @param {Object} options Options for this TSClientProtocol handler
	 * @param {string} options.contentIdStem The Content Identifier stem is considered to match the timed content currently being presented by the TV Device
	 * @param {string} options.timelineSelector The Timeline Selector describes the type and location of timeline signalling to be derived from the Timed Content
	currently being presented by the TV Device
	 * @param {Number} [options.tickrate] The tickrate of the timeline that is specified by the timelineSelector. If specified, then will be used to set the tickrate of teh provided clock.
	 * @param {*} [options.dest] The destination that the client should use when sending not in response to a received message. The value used here will depend on the {SocketAdaptor} being used.
	 */

	function TSClientProtocol (syncTLClock, options) {
	  if (!(
	      typeof syncTLClock.setCorrelation == "function" &&
	      typeof options.contentIdStem == "string" &&
	      typeof options.timelineSelector == "string"
	  ))
	  {
	    throw "TSClientProtocol(): Invalid parameters";
	  }

	  events.EventEmitter.call(this);
	  PRIVATE.set(this, {});
	  var priv = PRIVATE.get(this);

	  // the clock object this TSClientProtocol shall manage
	  priv.syncTLClock = syncTLClock;

	  // the content id stem for the setup message
	  priv.contentIdStem = options.contentIdStem;
	  // the timeline selector identifying the synchronisation timeline
	  priv.timelineSelector = options.timelineSelector;
	  // the tickrate of the timeline in ticks per seconds
	  var tr = Number(options.tickRate);
	  if (!isNaN(tr) && tr > 0) {
	      syncTLClock.tickRate = tr;
	  }

	  priv.dest = (options.dest)?options.dest:null;

	  priv.syncTLClock.setAvailabilityFlag(false);
	}

	inherits(TSClientProtocol, events.EventEmitter);

	/**
	 * @inheritdocs
	 */
	TSClientProtocol.prototype.start = function() {
	    this._sendSetupMessage();
	}


	/**
	 * @inheritdocs
	 */
	TSClientProtocol.prototype.stop = function() {
	  var priv = PRIVATE.get(this);
	  var syncTLClock = priv.syncTLClock;
	  syncTLClock.setAvailabilityFlag(false);
	}

	/*
	 * Start the protocol by sending the setup message to the server.
	 */
	TSClientProtocol.prototype._sendSetupMessage = function () {
	  var priv = PRIVATE.get(this);

	  var setupMsg = new TSSetupMessage(priv.contentIdStem, priv.timelineSelector);
	  this.emit("send", setupMsg.serialise(), priv.dest);
	}

	/**
	 * Handle control timestamps and update CorrelatedClock that represents the synchronisation timeline.
	 *
	 * @param {string} msg the control timestamp as defined in DVB CSS
	 */
	TSClientProtocol.prototype.handleMessage = function (msg) {
	  var priv = PRIVATE.get(this);
	  var syncTLClock = priv.syncTLClock;

	  try {
	    var cts = ControlTimestamp.deserialise(msg);
	    priv.prevControlTimestamp = cts;

	    var isAvailable = (cts.contentTime !== null);

	    if (isAvailable) {
	      var correlation = new Correlation(syncTLClock.parent.fromNanos(cts.wallClockTime), cts.contentTime);
	      var speed = cts.timelineSpeedMultiplier;

	      if (!syncTLClock.availabilityFlag || syncTLClock.isChangeSignificant(correlation, speed, 0.010)) {
	        syncTLClock.setCorrelationAndSpeed(correlation, speed);
	      }
	    }

	    syncTLClock.setAvailabilityFlag(isAvailable);

	  } catch (e) {

	    throw "TSCP handleMessage: exception: " + e + " -- msg: " + msg;
	  }
	};


	module.exports = TSClientProtocol;


/***/ }),
/* 229 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var WebSocketAdaptor = __webpack_require__(216);
	var TSClientProtocol = __webpack_require__(228);

	/**
	 * @memberof dvbcss-protocols.TimelineSynchronisation
	 * @description
	 * Factory function that creates a TS protocol client that uses a WebSocket
	 * and sends/receives protocol messages in JSON format.
	 *
	 * @param {WebSocket} webSocket A W3C WebSockets API comaptible websocket connection object
	 * @param {CorrelatedClock} syncTLClock The clock to represent the timeline. It will be updated according to the timestamp messages received.
	 * @param {Object} clientOptions
	 * @param {string} clientOptions.contentIdStem The Content Identifier stem is considered to match the timed content currently being presented by the TV Device
	 * @param {string} clientOptions.timelineSelector The Timeline Selector describes the type and location of timeline signalling to be derived from the Timed Content
	currently being presented by the TV Device
	 * @param {Number} clientOptions.tickrate The tickrate of the timeline that is specified by the timelineSelector.
	 * @returns {dvbcss-protocols.SocketAdaptors.WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
	 */
	var createTSClient = function(webSocket, syncTLClock, clientOptions) {
	    return new WebSocketAdaptor(
	        new TSClientProtocol(
	            syncTLClock,
	            clientOptions
	        ),
	        webSocket);
	};


	module.exports = createTSClient;


/***/ }),
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var TimelineProperties = __webpack_require__(231);

	/**
	 * @memberof dvbcss-protocols.CII
	 * @class
	 * @description
	 * Object representing a CII message sent from the MSAS to the synchronisation clients.
	 *
	 * @constructor
	 * @param {String} [protocolVersion] The protocol version being used by the server or <code>undefined</code>.
	 * @param {?String} [mrsUrl] The URL of an MRS server known to the server, or <code>null</code> or <code>undefined</code>.
	 * @param {?String} [contentId] Content identifier URI, or <code>undefined</code>.
	 * @param {?String} [contentIdStatus] Content identifier status, or <code>undefined</code>
	 * @param {?String} [presentationStatus] Presentation status as a string, e.g. "okay", or <code>undefined</code>
	 * @param {?String} [wcUrl] CSS-WC server endpoint URL in the form ???udp://<host>:<port>???, or <code>undefined</code>.
	 * @param {?String} [tsUrl] CSS-TS server endpoint WebSocket URL, or <code>undefined</code>.
	 * @param {?Array.<TimelineProperties>} [timelines] Array of timeline property objects, or <code>undefined</code>.
	 */
	var CIIMessage = function(protocolVersion, mrsUrl, contentId, contentIdStatus, presentationStatus, wcUrl, tsUrl, timelines) {

	  var self = this;
	  Object.defineProperty(self, "protocolVersion",    { enumerable: true, value: protocolVersion});
	  Object.defineProperty(self, "mrsUrl",             { enumerable: true, value: mrsUrl });
	  Object.defineProperty(self, 'contentId',          { enumerable: true, value: contentId });
	  Object.defineProperty(self, 'contentIdStatus',    { enumerable: true, value: contentIdStatus });
	  Object.defineProperty(self, 'presentationStatus', { enumerable: true, value: presentationStatus });
	  Object.defineProperty(self, 'wcUrl',              { enumerable: true, value: wcUrl });
	  Object.defineProperty(self, 'tsUrl',              { enumerable: true, value: tsUrl });
	  Object.defineProperty(self, 'timelines',          { enumerable: true, value: timelines });
	};


	/**
	 * Serialise to JSON
	 * @returns {String} JSON representation of this CII message as defined by ETSI TS 103 286 clause 5.6.7
	 */
	CIIMessage.prototype.serialise = function () {
	  return JSON.stringify(this);
	};

	/**
	 * Parse a JSON representation of a CII message as defined by ETSI TS 103 286 clause 5.6.7.
	 * @param {String} jsonVal The CII message encoded as JSON.
	 * @returns {CIIMessage} with the same properties as the JSON?? passed as the argument
	 */
	CIIMessage.deserialise = function (jsonVal) {
	    // coerce from arraybuffer,if needed
	    if (jsonVal instanceof ArrayBuffer) {
	        jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal));
	    }
	  var o = JSON.parse(jsonVal);

	  var myTimelines= [];
	  var timeline;

	  if (Array.isArray(o.timelines))
	  {
	      o.timelines.forEach(function(timelineObj) {

	        timeline = TimelineProperties.getFromObj(timelineObj);

	        if (typeof timeline !== "undefined")
	        {
	          myTimelines.push(timeline);
	        }
	    });
	  }
	  return new CIIMessage (o.protocolVersion, o.msrUrl, o.contentId, o.contentIdStatus, o.presentationStatus, o.wcUrl, o.tsUrl, myTimelines);

	};

	/**
	 * A set of bit masks representing each property in a CII message. Used by ORing together to flag which properties have changed in [ciiChangedCallback()]{@link ciiChangedCallback}
	 * @readonly
	 * @enum {number}
	 */
	CIIMessage.CIIChangeMask = CIIMessage.prototype.CIIChangeMask = {
	    /** Mask for the bit that is set if this is the first CII message received */
		FIRST_CII_RECEIVED:          (1 << 0),
	    /** Mask for the bit that is set if the "mrsUrl" property has changed */
		MRS_URL_CHANGED:             (1 << 1),
	    /**  Mask for the bit that is set if the "contentId" property has changed */
		CONTENTID_CHANGED:           (1 << 2),
	    /** Mask for the bit that is set if the "contentIdStatus" property has changed */
		CONTENTID_STATUS_CHANGED:    (1 << 3),
	    /** Mask for the bit that is set if the "presentationStatus" property has changed */
		PRES_STATUS_CHANGED:         (1 << 4),
	    /** Mask for the bit that is set if the "wcUrl" property has changed */
		WC_URL_CHANGED:              (1 << 5),
	    /** Mask for the bit that is set if the "tsUrl" property has changed */
		TS_URL_CHANGED:              (1 << 6),
	    /** Mask for the bit that is set if the "timelines" property has changed */
		TIMELINES_CHANGED:           (1 << 7),
	    /** Mask for the bit that is set if the "protocolVersion" property has changed */
	    PROTOCOL_VERSION_CHANGED:    (1 << 8)
	};


	var CII_KEYS = [
	    "protocolVersion",
	    "mrsUrl",
	    "contentId",
	    "contentIdStatus",
	    "presentationStatus",
	    "tsUrl",
	    "wcUrl",
	    "timelines"
	];

	var CHANGE_MASKS = {
	    "protocolVersion" : CIIMessage.CIIChangeMask.PROTOCOL_VERSION_CHANGED,
	    "mrsUrl" : CIIMessage.CIIChangeMask.MRS_URL_CHANGED,
	    "contentId" : CIIMessage.CIIChangeMask.CONTENTID_CHANGED,
	    "contentIdStatus" : CIIMessage.CIIChangeMask.CONTENTID_STATUS_CHANGED,
	    "presentationStatus" : CIIMessage.CIIChangeMask.PRES_STATUS_CHANGED,
	    "tsUrl" : CIIMessage.CIIChangeMask.WC_URL_CHANGED,
	    "wcUrl" : CIIMessage.CIIChangeMask.TS_URL_CHANGED,
	    "timelines" : CIIMessage.CIIChangeMask.TIMELINES_CHANGED
	};

	/**
	 * Checks if two CII Message objects are equivalent
	 * by checking if all CII properties match exactly.
	 * @param {CIIMessage} obj
	 * @returns {Boolean} Truthy if the properties of both CIIMessage objects  are equal.
	 */
	CIIMessage.prototype.equals = function(obj) {
	    try {
	        return typeof obj === "object" &&
	            this.protocolVersion === obj.protocolVersion &&
	            this.mrsUrl === obj.mrsUrl &&
	            this.contentId === obj.contentId &&
	            this.contentIdStatus === obj.contentIdStatus &&
	            this.presentationStatus === obj.presentationStatus &&
	            this.wcUrl === obj.wcUrl &&
	            this.tsUrl === obj.tsUrl &&
	            timelinesEqual(this.timelines, obj.timelines);

	    } catch (e) {
	        return false;
	    }
	};

	function timelinesEqual(tA, tB) {
	    return tA === tB || (
	        tA instanceof Array &&
	        tB instanceof Array &&
	        tA.length === tB.length &&
	        tA.map( function(e, i) {
	            return e.equals(tB[i]);
	        }).reduce(  function(x,y) {
	            return x && y;
	        }, true)
	    );
	}


	CIIMessage.prototype.compare = function (anotherCII, retChanges)
	{
	    var changemask = 0;
	    var name, i;
	    retChanges = retChanges === undefined ? {} : retChanges;
	    
	    for(i=0; i<CII_KEYS.length; i++) {
	        name=CII_KEYS[i];
	        if (anotherCII[name] === undefined) {
	            retChanges[name] = false;

	        } else {
	            if (name === "timelines") {
	                retChanges[name] = !timelinesEqual(this[name], anotherCII[name]);
	            } else {
	                retChanges[name] = anotherCII[name] !== this[name];
	            }
	            
	            if (retChanges[name]) {
	                changemask |= CHANGE_MASKS[name];
	            }
	            
	        }
	    }
	    return changemask;
	};


	/**
	 * Merge properties of this CIIMessage with the supplied CIIMessage.
	 * The returned CIIMessage contains all the properties from both. If
	 * a property is undefined in the supplied CIIMessage then its value from this
	 * message is preserved. If a property is defined in the supplied CIIMessage
	 * then that value is taken and the one from this message is ignored.
	 *
	 * @param {CIIMessage} newerCII whose defined properties override those of the existing CIIMessage.
	 * @return {CIIMessage} that is the result of the merge.
	 */ 
	CIIMessage.prototype.merge = function (newerCII) {
	    var merged = {};
	    var i, key;
	    
	    for(i=0; i<CII_KEYS.length; i++) {
	        key = CII_KEYS[i];
	        if (newerCII[key] !== undefined) {
	            merged[key] = newerCII[key];
	        } else {
	            merged[key] = this[key];
	        }
	    }
	    
	    return new CIIMessage(
	        merged.protocolVersion,
	        merged.mrsUrl,
	        merged.contentId,
	        merged.contentIdStatus,
	        merged.presentationStatus,
	        merged.wcUrl,
	        merged.tsUrl,
	        merged.timelines
	    );
	};

	module.exports = CIIMessage;


/***/ }),
/* 231 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/


	/**
	 * @memberof dvbcss-protocols.CII
	 * @class
	 * @description
	 * Object representing properties for an available timeline signalled in a CII message.
	 *
	 * @constructor
	 * @param {String} timelineSelector the timeline selector for this timeline
	 * @param {Number} unitsPerTick the denominator of the tick rate
	 * @param {Number} unitsPerSecond the numerator of the tick rate
	 * @param {Number} [accuracy] Indication of timeline accuracy, or <code>undefined</code>
	 */
	var TimelineProperties = function(timelineSelector, unitsPerTick, unitsPerSecond, accuracy) {


	  const self = this;

	  Object.defineProperty(self, "timelineSelector",  { enumerable: true, value: timelineSelector});
	  Object.defineProperty(self, "unitsPerTick",      { enumerable: true, value: Number(unitsPerTick)});
	  Object.defineProperty(self, "unitsPerSecond",    { enumerable: true, value: Number(unitsPerSecond) });
	  Object.defineProperty(self, 'accuracy',          { enumerable: true, value: Number(accuracy) });


	}

	/**
	 * Create a {TimelineProperties} object from a plain Javascript object with the same properties.
	 * @param {Object} o An object with the same properties as a TimelineProperties object.
	 * @returns {TimelineProperties} with the same properties as the object passed as the argument
	 */
	TimelineProperties.getFromObj = function (o) {

	  return new TimelineProperties(o.timelineSelector,
	                                typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.unitsPerTick : o.unitsPerTick,
	                                typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.unitsPerSecond : o.unitsPerSecond,
	                                typeof o.timelineProperties !== 'undefined' ? o.timelineProperties.accuracy : o.accuracy
	                              );
	}


	/**
	 * Serialise to JSON
	 * @returns {String} JSON representation of these timeline properties
	 */
	TimelineProperties.prototype.serialise = function()
	{
		  return JSON.stringify(this);
	}

	/**
	 * Parse a JSON representation of timeline properties.
	 * @param {String} jsonVal The timeline properties encoded as JSON.
	 * @returns {TimelineProperties} with the same properties as the JSON?? passed as the argument
	 */
	TimelineProperties.deserialise = function (jsonVal) {
	    // coerce from arraybuffer,if needed
	    if (jsonVal instanceof ArrayBuffer) {
	        jsonVal = String.fromCharCode.apply(null, new Uint8Array(jsonVal));
	    }
	  var o = JSON.parse(jsonVal);

	  return new TimelineProperties (o.timelineSelector, o.unitsPerTick, o.unitsPerSecond, o.accuracy);
	};

	TimelineProperties.prototype.equals = function(obj) {
	    return obj instanceof Object &&
	        this.timelineSelector === obj.timelineSelector &&
	        (this.unitsPerTick === obj.unitsPerTick ||
	            (isNaN(this.unitsPerTick) && isNaN(obj.unitsPerTick))) &&
	        (this.unitsPerSecond === obj.unitsPerSecond ||
	            (isNaN(this.unitsPerSecond) && isNaN(obj.unitsPerSecond))) &&
	        (this.accuracy === obj.accuracy ||
	            (isNaN(this.accuracy) && isNaN(obj.accuracy)))
	};

	module.exports = TimelineProperties;


/***/ }),
/* 232 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var events = __webpack_require__(3);
	var inherits = __webpack_require__(2);

	var CIIMessage = __webpack_require__(230);
	var WeakMap   = (typeof window !== "undefined" && window.WeakMap) || __webpack_require__(4);
	var PRIVATE   = new WeakMap();


	/**
	 * CII Client callback
	 * @callback ciiChangedCallback
	 * @param {dvbcss-protocols.CII.CIIMessage} cii The current CII state
	 * @param {Number} changemask A [bitfield mask]{@link dvbcss-protocols.CII.CIIMessage.CIIChangeMask} describing which CII properties have just changed
	 */


	/**
	 * @memberof dvbcss-protocols.CII
	 * @class
	 * @description Implementation of the client part of the CII protocol as defined in DVB CSS.
	   With start() the protocol is initiated.
	 *
	 * @implements ProtocolHandler
	 * @fires dvbcss-protocols.CII.CIIClientProtocol#change
	 *
	 * @constructor
	 * @param {Object} [clientOptions] Optional. Parameters for this protocol client.
	 * @param {ciiChangedCallback} [clientOptions.callback] Optional. Specify a callback function that will be passed the 
	 */

	function CIIClientProtocol (clientOptions) {
	  events.EventEmitter.call(this);
	  PRIVATE.set(this, {});
	  var priv = PRIVATE.get(this);
	  
	  // initial "state" assumed before messages are received.
	  priv.cii = new CIIMessage(null, null, null, null, null, null, null, null);

	  if (clientOptions instanceof Object) {
	      priv.CIIChangeCallback = clientOptions.callback
	  }

	  /**
	   * The current CII state, as shared by the server (the TV).
	   * This is not the most recently received message (since that may only
	   * describe changes since the previous message). Instead this is the result
	   * of applying those changes to update the client side model of the server
	   * side CII state.
	   * @property {CIIMessage}
	   * @name dvbcss-protocols.CII.CIIClientProtocol#cii
	   */
	  Object.defineProperty(this, 'cii', {
	      enumerable: true,
	      get: function() { return priv.cii }
	  })
	}

	inherits(CIIClientProtocol, events.EventEmitter);


	/**
	 * @inheritdocs
	 */
	CIIClientProtocol.prototype.start = function() {

	  var priv = PRIVATE.get(this);
	  priv.started = true;
	}


	/**
	 * @inheritdocs
	 */
	CIIClientProtocol.prototype.stop = function() {
	  var priv = PRIVATE.get(this);
	  priv.started = false;
	}

	/**
	 * Handle CII messages .
	 *
	 * @param {string} msg the control timestamp as defined in DVB CSS
	 */
	CIIClientProtocol.prototype.handleMessage = function (msg) {
	  var priv = PRIVATE.get(this);
	  var changemask;
	  var changeNames = {};

	//  console.log("CIIClientProtocol.prototype.handleMessage() - received CII message: " + msg);

	   var receivedCII = CIIMessage.deserialise(msg);

	  if (typeof receivedCII !== "undefined")
	  {
	    changemask = priv.cii.compare(receivedCII, changeNames);

	    if (priv.lastCII === undefined) {
	    	changemask |= CIIMessage.prototype.CIIChangeMask.FIRST_CII_RECEIVED;
	    }
	    priv.lastCII = receivedCII;
	    priv.cii = priv.cii.merge(receivedCII);

	    if ((changemask != 0) ) {
	        if (priv.CIIChangeCallback !== undefined) {
	        	priv.CIIChangeCallback(priv.cii, changemask);
	        }
	        /**
	         * @memberof dvbcss-protocols.CII.CIIClientProtocol
	         * @event change
	         * @description
	         * The CII state of the server has changed.
	         * @param {dvbcss-protocols.CII.CIIMessage} cii The current CII state of the server
	         * @param {Object} changedNames 
	         * @param {number} changeMask A [bitfield mask]{@link dvbcss-protocols.CII.CIIMessage.CIIChangeMask} describing which CII properties have just changed
	         */
	        this.emit("change", priv.cii, changeNames, changemask);
	    }

	  }
	};


	/**
	 * Returns true if this protocol handler is started.
	 */
	CIIClientProtocol.prototype.isStarted = function() {
		var priv = PRIVATE.get(this);

		return priv.started ? true:false;
	};

	module.exports = CIIClientProtocol;



/***/ }),
/* 233 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
	 * 
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 * 
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 * 
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	*****************************************************************************/

	var events = __webpack_require__(3);
	var inherits = __webpack_require__(2);

	var WebSocketAdaptor = __webpack_require__(216);
	var CIIMessage = __webpack_require__(230);
	var CIIClientProtocol = __webpack_require__(232);

	function AdaptorWrapper(ciiClientProtocol, adaptor) {
		events.EventEmitter.call(this)

		var self = this
		ciiClientProtocol.on("change", function(cii, changes, mask) {
			self.emit("change", cii, changes, mask);
		});
		
		this.stop = function() { return adaptor.stop() }
		this.isStarted = function() { return adaptor.isStarted() }
	}

	inherits(AdaptorWrapper, events.EventEmitter);


	/**
	 * @memberof dvbcss-protocols.CII
	 * @description
	 * Factory function that creates a CII client that uses a WebSocket
	 * and sends/receives protocol messages in JSON format.
	 *
	 * @param {WebSocket} webSocket A W3C WebSockets API compatible websocket connection object
	 * @param {Object} clientOptions
	 * @returns {dvbcss-protocols.SocketAdaptors.WebSocketAdaptor} The WebSocket adaptor wrapping the whole client, but with change event added
	 */
	var createCIIClient = function(webSocket, clientOptions) {
		
		var protocol = new CIIClientProtocol(clientOptions)
		var wsa = new WebSocketAdaptor(protocol, webSocket);
		
		return new AdaptorWrapper(protocol, wsa);
	};


	module.exports = createCIIClient;


/***/ }),
/* 234 */
/***/ (function(module, exports, __webpack_require__) {

	var PresentationTimestamp = __webpack_require__(235);
	var Correlation = __webpack_require__(220).Correlation;

	/**
	 * @class Timeline
	 * @description
	 *
	 * Object representing a timeline instance
	 *
	 * @constructor
	 * @param {string} timelineId Unique identifier for this timeline
	 * @param {object} [options]
	 * @param {string} [options.timelineType=null] Timeline type specifier
	 * @param {number} [options.frequency=1000] Number of ticks per second on this timeline
	 * @param {string} [options.contentId=null] Unique identifier for this timeline
	 * @param {CorrelatedClock} [options.clock=null] Timeline clock
	 * @param {string} [options.updateChannel=null] Channel to which updates of the timeline clock are reported
	 * @param {number} [options.thresholdSecs=0.02] Signifcance threshold for changes to timeline clock
	 * @param {boolean} [options.useForSessionSync=false] TRUE if this timeline shall be considered for synchronising,
	 *  the whole session by the sync controller, else FALSE.
	 * @param {boolean} [options.writable=true] TRUE if this timeline can be changed by calling timeline.update()
	 */
	var Timeline = function(timelineId, options) {

	    var opt = options || {};

	    if (typeof timelineId !== "string") {
	        throw ("Missing one or more mandatory parameters or saw one or more wrong parameter types.");
	    }

	    Object.defineProperties(this, {
	        "timelineId": {
	            enumerable: true,
	            value: timelineId
	        },
	        "timelineType": { 
	            enumerable: true, 
	            writable: true,
	            value: opt.timelineType || null
	        },
	        "frequency": { 
	            enumerable: true, 
	            writable: true,
	            value: opt.frequency || 1000
	        },
	        "contentId": {
	            enumerable: true,
	            writable: true,
	            value: opt.contentId || null
	        },
	        "clock": {
	            enumerable: true,
	            writable: true,
	            value: opt.clock || null
	        },
	        "updateChannel": {
	            enumerable: true,
	            writable: true,
	            value: opt.updateChannel || null
	        },
	        "thresholdSecs": {
	            enumerable: true,
	            writable: true,
	            value: opt.thresholdSecs || .02
	        },
	        "useForSessionSync": {
	            enumerable: true,
	            writable: true,
	            value: opt.useForSessionSync || false
	        },
	        "writable": {
	            enumerable: true,
	            writable: true,
	            value: opt.writable || true
	        }
	    });
	};

	/**
	 * Updates clock correlation and speed, if change is significant.
	 * Updates do only have an affect on writable timelines.
	 * @param {Timestamp} timestamp
	 * @returns {boolean} TRUE if clock was updated, else FALSE
	 */
	Timeline.prototype.update = function (timestamp) {
	    
	    var correlation = new Correlation({
	        parentTime: timestamp.wallclockTime,
	        childTime: timestamp.contentTime
	    });
	    
	    if (this.writable && this.clock.isChangeSignificant(correlation, timestamp.speed, this.thresholdSecs)) {
	        this.clock.setCorrelationAndSpeed(correlation, timestamp.speed);
	        return true;
	    }

	    return false;
	};

	module.exports = Timeline;


/***/ }),
/* 235 */
/***/ (function(module, exports, __webpack_require__) {

	var Timestamp = __webpack_require__(236);

	/**
	 * @class PresentationTimestamp
	 * 
	 * @example <caption>Create a PresentationTimestamp from a CorrelatedClock and a wallclock</caption>
	 * // mediaClock is a CorrelatedClock that represents the timeline of piece of content
	 * // wallClock is a CorrelatedClock that represents the wallclock
	 * // Set the earliest presentation time 5000 ticks before the actual presentation time
	 * // Set the latest presentation time 8000 ticks after the actual presentation time  
	 * var pts = new PresentationTimestamp(mediaClock, wallclock, -5000, 8000);
	 * 
	 * @example <caption>Create a PresentationTimestamp from its JSON string representation</caption>
	 * // Assume we have a JSON string representation of a PresentationTimestamp called 'jsonPts'
	 * // Convert to object using JSON.parse()
	 * var ptsLikeObj = JSON.parse(jsonPts);
	 * // To make this object an instance of PresentationTimestamp pass it to the contructor
	 * var pts = new PresentationTimestamp(ptsLikeObj);
	 * 
	 * @constructor
	 * @param {CorrelatedClock|Object} clockOrObject Either a clock object or a object with same properties as a instance of
	 *      PresentationTimestamp (e.g. derived through JSON.parse(JSON.stringify(presentationTimestamp)))
	 * @param {CorrelatedClock} [wallclock] 
	 * @param {number} [offsetEarliest=0] 
	 * @param {number} [offsetLatest=0] 
	 */

	var PresentationTimestamp = function (clockOrObject, wallclock, offsetEarliest, offsetLatest) {
	    var earliest, actual, latest;
	    
	    // if (isClockObject(clockOrObject)) {
	    //     earliest = new Timestamp(clockOrObject.now()+offsetEarliest, wallclock.now(), clockOrObject.speed);
	    //     actual = new Timestamp(clockOrObject.now()+78, wallclock.now(), clockOrObject.speed);
	    //     latest = new Timestamp(clockOrObject.now()+offsetLatest, wallclock.now(), clockOrObject.speed);
	    // }

	    // else {
	    //     earliest = new Timestamp(clockOrObject.earliest.contentTime, clockOrObject.earliest.wallclockTime, clockOrObject.earliest.speed);
	    //     actual = new Timestamp(clockOrObject.actual.contentTime+78, clockOrObject.actual.wallclockTime, clockOrObject.actual.speed);
	    //     latest = new Timestamp(clockOrObject.latest.contentTime, clockOrObject.latest.wallclockTime, clockOrObject.latest.speed);
	    // }


	     
	    if (isClockObject(clockOrObject)) {
	        earliest = new Timestamp(clockOrObject.now()+offsetEarliest, wallclock.now(), clockOrObject.getEffectiveSpeed());
	        actual = new Timestamp(clockOrObject.now(), wallclock.now(), clockOrObject.getEffectiveSpeed());
	        latest = new Timestamp(clockOrObject.now()+offsetLatest, wallclock.now(), clockOrObject.getEffectiveSpeed());
	    }

	    else {
	        earliest = new Timestamp(clockOrObject.earliest.contentTime, clockOrObject.earliest.wallclockTime, clockOrObject.earliest.speed);
	        actual = new Timestamp(clockOrObject.actual.contentTime, clockOrObject.actual.wallclockTime, clockOrObject.actual.speed);
	        latest = new Timestamp(clockOrObject.latest.contentTime, clockOrObject.latest.wallclockTime, clockOrObject.latest.speed);
	    }

	    Object.defineProperties(this, {
	        /**
	         * [Timestamp]{@link Timestamp} object representing the earliest possible time on the presentation timeline 
	         * a client can present.
	         * @var {Timestamp} earliest
	         * @memberof PresentationTimestamp
	         * @readonly
	         * @instance
	         */
	        earliest: {
	            value: earliest,
	            enumerable: true
	        },
	        /**
	         * [Timestamp]{@link Timestamp} object representing the actuale position on a client's presentation timeline.
	         * @var {Timestamp} actual
	         * @memberof PresentationTimestamp
	         * @readonly
	         * @instance
	         */
	        actual: {
	            value: actual,
	            enumerable: true
	        },
	        /**
	         * [Timestamp]{@link Timestamp} object representing the latest possible time on the presentation timeline 
	         * a client can present.
	         * @var {Timestamp} latest
	         * @memberof PresentationTimestamp
	         * @readonly
	         * @instance
	         */
	        latest: {
	            value: latest,
	            enumerable: true
	        }
	    });
	};

	function isClockObject (candidate) {
	    // If these criteria are fulfilled the object is likely a clock object
	    if (typeof candidate.getSpeed === "function" &&
	        typeof candidate.now === "function" &&
	        typeof candidate.setAtTime === "function" &&
	        typeof candidate.setTickRate === "function")
	    {
	        return true;
	    }
	    return false;
	}

	module.exports = PresentationTimestamp;

/***/ }),
/* 236 */
/***/ (function(module, exports) {

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

/***/ }),
/* 237 */
/***/ (function(module, exports, __webpack_require__) {

	var b64 = __webpack_require__(211),
	    URN = __webpack_require__(238),
	    TimelineId;

	/**
	 * @class TimelineId
	 * 
	 * @classdesc 
	 * Globally unique identifier for a content timeline.
	 * 
	 * @example
	 * // Create instance
	 * var timlineId = new TimelineId("ctx1", "dvc1", "src1");
	 * 
	 * // Returns "urn:ctx1:dvc1:src1"
	 * var urnString = timelineId.toUrnString();
	 * 
	 * // Creates new timeline instance from URN string
	 * timelineId = TimelineId.parse(urnString);
	 * 
	 * // Returns "ctx1"
	 * timelineId.contextId;
	 * 
	 * @constructor
	 * @param {string} contextId
	 * @param {string} deviceId
	 * @param {string} sourceId
	 */
	TimelineId = function (contextId, deviceId, sourceId) {

	    var contextId, deviceId, sourceId; 
	    
	    contextId = contextId;
	    deviceId = deviceId;
	    sourceId = sourceId;

	    Object.defineProperties(this, {

	        /**
	         * @var {string} contextId
	         * @memberof TimelineId
	         * @readonly
	         * @instance
	         */
	        "contextId": {
	            get: function () { return contextId; },
	            enumerable: true
	        },

	        /**
	         * @var {string} deviceId
	         * @memberof TimelineId
	         * @readonly
	         * @instance
	         */
	        "deviceId": {
	            get: function () { return deviceId; },
	            enumerable: true
	        },

	        /**
	         * @var {string} sourceId
	         * @memberof TimelineId
	         * @readonly
	         * @instance
	         */
	        "sourceId": {
	            get: function () { return sourceId; },
	            enumerable: true
	        }
	    });
	};

	/**
	 * Converts the TimelineId obejct into URN string representation.
	 * @returns {string} URN formatted string. 
	 */
	TimelineId.prototype.toUrnString = function () {
	    var id = [];
	    id.push(this.contextId);
	    id.push(this.deviceId);
	    id.push(b64.encodeUnicode(this.sourceId));
	    return URN.stringify(id);
	};

	/**
	 * Creates a TimelineId object from its URN string representation.
	 * @param {string} urnString URN formatted string urn:<contextId>:<deviceId>:<sourceId>
	 * @returns {TimelineId}
	 */
	TimelineId.fromUrnString = function (urnString) {
	    var id, instance;
	    id = URN.parse(urnString);
	    id[2] = id[2] && b64.decodeUnicode(id[2]) || null;
	    instance = new (Function.prototype.bind.apply(TimelineId, [null].concat(id)));
	    return instance;
	};

	module.exports = TimelineId;

/***/ }),
/* 238 */
/***/ (function(module, exports) {

	function stringify (arr) {
	    var i, urn;
	    urn = "urn";
	    arr.forEach(function(elem) {
	        urn += ":" + elem;
	    });
	    return urn;
	}

	function parse (urnString) {
	    return urnString.split(":").splice(1);
	}

	module.exports = {
	    stringify: stringify,
	    parse: parse
	};

/***/ }),
/* 239 */
/***/ (function(module, exports, __webpack_require__) {

	var Timelines, Timeline, inherits;

	inherits = __webpack_require__(2);
	Timeline = __webpack_require__(234);

	/**
	 * @class Timelines
	 * 
	 * @classdesc
	 * A list of timelines, where each timeline is unique with regard to property values.
	 * 
	 */
	Timelines = function () {};
	inherits(Timelines, Array);

	/** 
	 * Get timeline by ID.
	 * @param {string} timelineId
	 * @return {Timeline} Returns the timeline whos timelineId matches ID. Returns NULL, if nonde in list.
	 */
	Timelines.prototype.getById = function (timelineId) {
	    var res = null;
	    this.forEach(function (tl) {
	        if (tl.timelineId === timelineId) {
	            res = tl;
	        }
	    });
	    return res;
	};

	/**
	 * Returns list of timelines that match a givene contentId
	 * @param {string} contentId
	 * @returns {array} Result set
	 */
	Timelines.prototype.getByContentId = function (contentId) {
	    var res = new Timelines();
	    this.forEach(function (tl) {
	        if (tl.contentId === contentId) {
	            res.push(tl);
	        }
	    });
	    return res;
	};

	/**
	 * Returns a list of timelines that match a given timeline type
	 * @param {string} timelineType
	 * @returns {array} Result set
	 */
	Timelines.prototype.getByTimelineType = function (timelineType) {
	    var res = new Timelines();
	    this.forEach(function (tl) {
	        if (tl.timelineType === timelineType) {
	            res.push(tl);
	        }
	    });
	    return res;
	};

	/**
	 * Adds timeline to this list of timelines, if not already contained.
	 * @param {Timeline} timeline
	 */
	Timelines.prototype.add = function (timeline) {
	    if (!(timeline instanceof Timeline)) {
	        throw "Timeline.add: Did not add item to Timelines, as item is not recognised as an instance of Timeline";
	    }
	    if (this.contains(timeline) < 0) {
	        this.push(timeline);
	    }
	};

	/**
	 * If timeline contained in list, removes it from list.
	 * @param {Timeline} timeline to be removed.
	 */
	Timelines.prototype.remove = function (timeline) {
	    var searchIndex;
	    if (!(timeline instanceof Timeline)) {
	        throw "Timeline.remove: Did not remove item from Timelines, as item is not recognised as an instance of Timeline";
	    }
	    searchIndex = this.contains(timeline);
	    if (searchIndex > -1) {
	        this.splice(searchIndex, 1);
	    }
	};

	/**
	 * Checks if timeline exists in this list of timelines.
	 * @param {Timeline} timeline
	 */
	Timelines.prototype.contains = function (timeline) {
	    var searchIndex = -1;
	    this.forEach(function (tl, i) {
	        if (tl.timelineId === timeline.timelineId) {
	            searchIndex = i;
	        }
	    });
	    return searchIndex;
	};

	module.exports = Timelines;


/***/ }),
/* 240 */
/***/ (function(module, exports, __webpack_require__) {

	var WeakMap = __webpack_require__(4);

	var PRIVATE = new WeakMap();


	/**
	 * @class TokenBucket
	 * 
	 * @classdesc
	 * A token bucket for rate limiting using the token
	 * {@link https://blog.figma.com/an-alternative-approach-to-rate-limiting-f8a06cf7c94c|bucket algorithm}.
	 * An action subject to rate limiting should only be
	 * performed if the TokenBucket.getToken call returns
	 * a token other than null.
	 * 
	 * @example
	 * var bucketSize = 50 // tokens
	 * var restockInterval = 10 // seconds
	 * var tokenBucket = new TokenBucket(bucketSize, restockInterval);
	 * 
	 * // Implement a function for rate-limited transmission of messages
	 * function send (message) {
	 *     if (tocketBucket.getToken() !== null) {
	 *         // Do send message
	 *     }
	 * }
	 * 
	 * @constructor
	 * @param {number} bucketSize Number of tokens in a filled bucket
	 * @param {number} restockInterval Interval in seconds after which the bucket is refilled 
	 */
	var TokenBucket = function (bucketSize, restockInterval) {
	    PRIVATE.set(this, {
	        size: bucketSize,
	        restockInterval: restockInterval*1000, // to milis
	        lastBucketRestock: null,
	        numTokensInBucket: 0
	    });
	};

	/**
	 * Returns null if bucket is empty, else returns token
	 * @returns {string} 
	 */
	TokenBucket.prototype.getToken = function () {
	    var priv = PRIVATE.get(this);

	    if (checkBucket.call(this)) {
	        priv.numTokensInBucket -= 1;
	        return generateToken.call(this);
	    } else {
	        return null;
	    }
	};

	/**
	 * Returns false if bucket is empty, else returns true.
	 * Fills bucket if last restock date exceeds 'restockInterval'
	 * or if bucket was never filled before.
	 * 
	 * @returns {boolean}
	 */
	function checkBucket () {
	    var priv = PRIVATE.get(this);

	    // Fill bucket initialy or if last restock date exceeds 'restockInterval'
	    if (priv.lastBucketRestock === null || (Date.now() - priv.lastBucketRestock > priv.restockInterval)) {
	        fillBucket.call(this);
	    }
	    
	    if (priv.numTokensInBucket < 1) {
	        return false;
	    } else {
	        return true;
	    }
	}

	function fillBucket () {
	    var priv = PRIVATE.get(this);
	    priv.numTokensInBucket = priv.size;
	    priv.lastBucketRestock = Date.now();
	}

	function generateToken () {
	    return "token";
	}

	module.exports = TokenBucket;

/***/ }),
/* 241 */
/***/ (function(module, exports) {

	/**
	 * 
	 * Enum for different timeline election algorithms.
	 * @enum {number}
	 * 
	 * @memberof CloudSyncKit
	 */
	SyncTLElection = {
	    /**
	     * The sync timeline is locked to the timeline that was registered
	     * first for this session.
	     */
	    EARLIEST_FIRST: 1,

	    /**
	     * The sync timeline is locked to the timeline with the lowest
	     * dispersion value. 
	     */
	    LOWEST_DISPERSION: 2,

	    /**
	     * The sync service computes a sync timeline from all registered
	     * timelines.
	     */
	    USE_ALL: 3,

	    /**
	     * The sync service changes the base timeline for the sync timeline 
	     * dynamically to the latest timeline to report a significant change.
	     */
	    DYNAMIC: 4
	};

	module.exports = SyncTLElection;

/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	var required = __webpack_require__(243)
	  , qs = __webpack_require__(244)
	  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i
	  , slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

	/**
	 * These are the parse rules for the URL parser, it informs the parser
	 * about:
	 *
	 * 0. The char it Needs to parse, if it's a string it should be done using
	 *    indexOf, RegExp using exec and NaN means set as current value.
	 * 1. The property we should set when parsing this value.
	 * 2. Indication if it's backwards or forward parsing, when set as number it's
	 *    the value of extra chars that should be split off.
	 * 3. Inherit from location if non existing in the parser.
	 * 4. `toLowerCase` the resulting value.
	 */
	var rules = [
	  ['#', 'hash'],                        // Extract from the back.
	  ['?', 'query'],                       // Extract from the back.
	  ['/', 'pathname'],                    // Extract from the back.
	  ['@', 'auth', 1],                     // Extract from the front.
	  [NaN, 'host', undefined, 1, 1],       // Set left over value.
	  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
	  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
	];

	/**
	 * These properties should not be copied or inherited from. This is only needed
	 * for all non blob URL's as a blob URL does not include a hash, only the
	 * origin.
	 *
	 * @type {Object}
	 * @private
	 */
	var ignore = { hash: 1, query: 1 };

	/**
	 * The location object differs when your code is loaded through a normal page,
	 * Worker or through a worker using a blob. And with the blobble begins the
	 * trouble as the location object will contain the URL of the blob, not the
	 * location of the page where our code is loaded in. The actual origin is
	 * encoded in the `pathname` so we can thankfully generate a good "default"
	 * location from it so we can generate proper relative URL's again.
	 *
	 * @param {Object|String} loc Optional default location object.
	 * @returns {Object} lolcation object.
	 * @api public
	 */
	function lolcation(loc) {
	  loc = loc || global.location || {};

	  var finaldestination = {}
	    , type = typeof loc
	    , key;

	  if ('blob:' === loc.protocol) {
	    finaldestination = new URL(unescape(loc.pathname), {});
	  } else if ('string' === type) {
	    finaldestination = new URL(loc, {});
	    for (key in ignore) delete finaldestination[key];
	  } else if ('object' === type) {
	    for (key in loc) {
	      if (key in ignore) continue;
	      finaldestination[key] = loc[key];
	    }

	    if (finaldestination.slashes === undefined) {
	      finaldestination.slashes = slashes.test(loc.href);
	    }
	  }

	  return finaldestination;
	}

	/**
	 * @typedef ProtocolExtract
	 * @type Object
	 * @property {String} protocol Protocol matched in the URL, in lowercase.
	 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
	 * @property {String} rest Rest of the URL that is not part of the protocol.
	 */

	/**
	 * Extract protocol information from a URL with/without double slash ("//").
	 *
	 * @param {String} address URL we want to extract from.
	 * @return {ProtocolExtract} Extracted information.
	 * @api private
	 */
	function extractProtocol(address) {
	  var match = protocolre.exec(address);

	  return {
	    protocol: match[1] ? match[1].toLowerCase() : '',
	    slashes: !!match[2],
	    rest: match[3]
	  };
	}

	/**
	 * Resolve a relative URL pathname against a base URL pathname.
	 *
	 * @param {String} relative Pathname of the relative URL.
	 * @param {String} base Pathname of the base URL.
	 * @return {String} Resolved pathname.
	 * @api private
	 */
	function resolve(relative, base) {
	  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
	    , i = path.length
	    , last = path[i - 1]
	    , unshift = false
	    , up = 0;

	  while (i--) {
	    if (path[i] === '.') {
	      path.splice(i, 1);
	    } else if (path[i] === '..') {
	      path.splice(i, 1);
	      up++;
	    } else if (up) {
	      if (i === 0) unshift = true;
	      path.splice(i, 1);
	      up--;
	    }
	  }

	  if (unshift) path.unshift('');
	  if (last === '.' || last === '..') path.push('');

	  return path.join('/');
	}

	/**
	 * The actual URL instance. Instead of returning an object we've opted-in to
	 * create an actual constructor as it's much more memory efficient and
	 * faster and it pleases my OCD.
	 *
	 * @constructor
	 * @param {String} address URL we want to parse.
	 * @param {Object|String} location Location defaults for relative paths.
	 * @param {Boolean|Function} parser Parser for the query string.
	 * @api public
	 */
	function URL(address, location, parser) {
	  if (!(this instanceof URL)) {
	    return new URL(address, location, parser);
	  }

	  var relative, extracted, parse, instruction, index, key
	    , instructions = rules.slice()
	    , type = typeof location
	    , url = this
	    , i = 0;

	  //
	  // The following if statements allows this module two have compatibility with
	  // 2 different API:
	  //
	  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
	  //    where the boolean indicates that the query string should also be parsed.
	  //
	  // 2. The `URL` interface of the browser which accepts a URL, object as
	  //    arguments. The supplied object will be used as default values / fall-back
	  //    for relative paths.
	  //
	  if ('object' !== type && 'string' !== type) {
	    parser = location;
	    location = null;
	  }

	  if (parser && 'function' !== typeof parser) parser = qs.parse;

	  location = lolcation(location);

	  //
	  // Extract protocol information before running the instructions.
	  //
	  extracted = extractProtocol(address || '');
	  relative = !extracted.protocol && !extracted.slashes;
	  url.slashes = extracted.slashes || relative && location.slashes;
	  url.protocol = extracted.protocol || location.protocol || '';
	  address = extracted.rest;

	  //
	  // When the authority component is absent the URL starts with a path
	  // component.
	  //
	  if (!extracted.slashes) instructions[2] = [/(.*)/, 'pathname'];

	  for (; i < instructions.length; i++) {
	    instruction = instructions[i];
	    parse = instruction[0];
	    key = instruction[1];

	    if (parse !== parse) {
	      url[key] = address;
	    } else if ('string' === typeof parse) {
	      if (~(index = address.indexOf(parse))) {
	        if ('number' === typeof instruction[2]) {
	          url[key] = address.slice(0, index);
	          address = address.slice(index + instruction[2]);
	        } else {
	          url[key] = address.slice(index);
	          address = address.slice(0, index);
	        }
	      }
	    } else if ((index = parse.exec(address))) {
	      url[key] = index[1];
	      address = address.slice(0, index.index);
	    }

	    url[key] = url[key] || (
	      relative && instruction[3] ? location[key] || '' : ''
	    );

	    //
	    // Hostname, host and protocol should be lowercased so they can be used to
	    // create a proper `origin`.
	    //
	    if (instruction[4]) url[key] = url[key].toLowerCase();
	  }

	  //
	  // Also parse the supplied query string in to an object. If we're supplied
	  // with a custom parser as function use that instead of the default build-in
	  // parser.
	  //
	  if (parser) url.query = parser(url.query);

	  //
	  // If the URL is relative, resolve the pathname against the base URL.
	  //
	  if (
	      relative
	    && location.slashes
	    && url.pathname.charAt(0) !== '/'
	    && (url.pathname !== '' || location.pathname !== '')
	  ) {
	    url.pathname = resolve(url.pathname, location.pathname);
	  }

	  //
	  // We should not add port numbers if they are already the default port number
	  // for a given protocol. As the host also contains the port number we're going
	  // override it with the hostname which contains no port number.
	  //
	  if (!required(url.port, url.protocol)) {
	    url.host = url.hostname;
	    url.port = '';
	  }

	  //
	  // Parse down the `auth` for the username and password.
	  //
	  url.username = url.password = '';
	  if (url.auth) {
	    instruction = url.auth.split(':');
	    url.username = instruction[0] || '';
	    url.password = instruction[1] || '';
	  }

	  url.origin = url.protocol && url.host && url.protocol !== 'file:'
	    ? url.protocol +'//'+ url.host
	    : 'null';

	  //
	  // The href is just the compiled result.
	  //
	  url.href = url.toString();
	}

	/**
	 * This is convenience method for changing properties in the URL instance to
	 * insure that they all propagate correctly.
	 *
	 * @param {String} part          Property we need to adjust.
	 * @param {Mixed} value          The newly assigned value.
	 * @param {Boolean|Function} fn  When setting the query, it will be the function
	 *                               used to parse the query.
	 *                               When setting the protocol, double slash will be
	 *                               removed from the final url if it is true.
	 * @returns {URL}
	 * @api public
	 */
	function set(part, value, fn) {
	  var url = this;

	  switch (part) {
	    case 'query':
	      if ('string' === typeof value && value.length) {
	        value = (fn || qs.parse)(value);
	      }

	      url[part] = value;
	      break;

	    case 'port':
	      url[part] = value;

	      if (!required(value, url.protocol)) {
	        url.host = url.hostname;
	        url[part] = '';
	      } else if (value) {
	        url.host = url.hostname +':'+ value;
	      }

	      break;

	    case 'hostname':
	      url[part] = value;

	      if (url.port) value += ':'+ url.port;
	      url.host = value;
	      break;

	    case 'host':
	      url[part] = value;

	      if (/:\d+$/.test(value)) {
	        value = value.split(':');
	        url.port = value.pop();
	        url.hostname = value.join(':');
	      } else {
	        url.hostname = value;
	        url.port = '';
	      }

	      break;

	    case 'protocol':
	      url.protocol = value.toLowerCase();
	      url.slashes = !fn;
	      break;

	    case 'pathname':
	    case 'hash':
	      if (value) {
	        var char = part === 'pathname' ? '/' : '#';
	        url[part] = value.charAt(0) !== char ? char + value : value;
	      } else {
	        url[part] = value;
	      }
	      break;

	    default:
	      url[part] = value;
	  }

	  for (var i = 0; i < rules.length; i++) {
	    var ins = rules[i];

	    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
	  }

	  url.origin = url.protocol && url.host && url.protocol !== 'file:'
	    ? url.protocol +'//'+ url.host
	    : 'null';

	  url.href = url.toString();

	  return url;
	}

	/**
	 * Transform the properties back in to a valid and full URL string.
	 *
	 * @param {Function} stringify Optional query stringify function.
	 * @returns {String}
	 * @api public
	 */
	function toString(stringify) {
	  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

	  var query
	    , url = this
	    , protocol = url.protocol;

	  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

	  var result = protocol + (url.slashes ? '//' : '');

	  if (url.username) {
	    result += url.username;
	    if (url.password) result += ':'+ url.password;
	    result += '@';
	  }

	  result += url.host + url.pathname;

	  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
	  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

	  if (url.hash) result += url.hash;

	  return result;
	}

	URL.prototype = { set: set, toString: toString };

	//
	// Expose the URL parser and some additional properties that might be useful for
	// others or testing.
	//
	URL.extractProtocol = extractProtocol;
	URL.location = lolcation;
	URL.qs = qs;

	module.exports = URL;

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }),
/* 243 */
/***/ (function(module, exports) {

	'use strict';

	/**
	 * Check if we're required to add a port number.
	 *
	 * @see https://url.spec.whatwg.org/#default-port
	 * @param {Number|String} port Port number we need to check
	 * @param {String} protocol Protocol we need to check against.
	 * @returns {Boolean} Is it a default port for the given protocol
	 * @api private
	 */
	module.exports = function required(port, protocol) {
	  protocol = protocol.split(':')[0];
	  port = +port;

	  if (!port) return false;

	  switch (protocol) {
	    case 'http':
	    case 'ws':
	    return port !== 80;

	    case 'https':
	    case 'wss':
	    return port !== 443;

	    case 'ftp':
	    return port !== 21;

	    case 'gopher':
	    return port !== 70;

	    case 'file':
	    return false;
	  }

	  return port !== 0;
	};


/***/ }),
/* 244 */
/***/ (function(module, exports) {

	'use strict';

	var has = Object.prototype.hasOwnProperty;

	/**
	 * Decode a URI encoded string.
	 *
	 * @param {String} input The URI encoded string.
	 * @returns {String} The decoded string.
	 * @api private
	 */
	function decode(input) {
	  return decodeURIComponent(input.replace(/\+/g, ' '));
	}

	/**
	 * Simple query string parser.
	 *
	 * @param {String} query The query string that needs to be parsed.
	 * @returns {Object}
	 * @api public
	 */
	function querystring(query) {
	  var parser = /([^=?&]+)=?([^&]*)/g
	    , result = {}
	    , part;

	  //
	  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
	  // the lastIndex property so we can continue executing this loop until we've
	  // parsed all results.
	  //
	  for (;
	    part = parser.exec(query);
	    result[decode(part[1])] = decode(part[2])
	  );

	  return result;
	}

	/**
	 * Transform a query string to an object.
	 *
	 * @param {Object} obj Object that should be transformed.
	 * @param {String} prefix Optional prefix.
	 * @returns {String}
	 * @api public
	 */
	function querystringify(obj, prefix) {
	  prefix = prefix || '';

	  var pairs = [];

	  //
	  // Optionally prefix with a '?' if needed
	  //
	  if ('string' !== typeof prefix) prefix = '?';

	  for (var key in obj) {
	    if (has.call(obj, key)) {
	      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
	    }
	  }

	  return pairs.length ? prefix + pairs.join('&') : '';
	}

	//
	// Expose the module.
	//
	exports.stringify = querystringify;
	exports.parse = querystring;


/***/ })
/******/ ]);