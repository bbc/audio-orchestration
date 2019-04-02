/****************************************************************************
/* FILE:                SyncToMasterController.js                			*/
/* DESCRIPTION:         A Sync Controller for master=slave sync 	        */
/* VERSION:             (see git)                                       	*/
/* DATE:                (see git)                                       	*/
/* AUTHOR:              Rajiv Ramdhany <rajiv.ramdhany@bbc.co.uk>    		*/

/* Copyright 2015 British Broadcasting Corporation							*/

/* Unless required by applicable law or agreed to in writing, software		*/
/* distributed under the License is distributed on an "AS IS" BASIS,		*/
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.	*/
/* See the License for the specific language governing permissions and		*/
/* limitations under the License.											*/
/****************************************************************************/
"use strict";


// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
var MessageIdGenerator = require("../../common/message/MessageIdGenerator");
var MessageFactory = require("../build/lib/MessageFactory");
var Messenger = require("../build/lib/Messenger");
var MessagingAdapter = require("../../common/messenger/messagingadapter/MqttMessagingAdapter");
var PresentationTimestamp = require("../../common/state/PresentationTimestamp");
var RedisConnection = require("../../common/datastore/redisconnection");  
const Timeline = require("../../common/state/Timeline");
const TimelineSourceType = require("../../common/state/TimelineSourceType");
const Device = require("../../common/state/Device");
const Session = require("../../common/state/Session");
const SyncTLElection = require("../../common/state/SyncTLElection");
var Logger = require("./logger");
var RedisSMQConfig = require("../../common/events/RedisSMQConfig");
const redisSMQ = require("redis-smq");
const Consumer = redisSMQ.Consumer;
const SyncEvents = require("../../common/events/syncevents_pb");
const uuidv4 = require("uuid/v4");
const Clocks = require("dvbcss-clocks");

var PRIVATE = new WeakMap();
var logger;


// ---------------------------------------------------------
//  Constants
// ---------------------------------------------------------

const kSyncControllerQueueKey = "cloudsync_synccontroller_waitQueue";
const kSessionRESPTopic = "Sessions/RESP";
const kTimelineChangeThreshold = 20;

// ---------------------------------------------------------
//  Class
// ---------------------------------------------------------
/**
 * @class SyncController
 * 
 * @classdesc A synchronisation controller * 
 * @constructor
 * @param {object} config config  
 * @param {object} config.redis
 * @param {string} config.redis.host
 * @param {number} config.redis.port
 * @param {object} config.log
 * @param {(boolean|number)} config.log.enabled
 * @param {object} config.log.config
 * @param {object} config.monitor
 * @param {(boolean|number)} config.monitor.enabled
 * @param {string} config.monitor.host
 * @param {number} config.monitor.port
 * @param {number} config.messageConsumeTimeout
 * @param {number} config.messageTTL
 * @param {number} config.messageRetryThreshold
 	
 */
class SyncController extends Consumer
{

	constructor(services, config)
	{
		super(new RedisSMQConfig(services.redis.host, services.redis.port, config.monitor.host, config.monitor.port).getConfig(),
			{messageConsumeTimeout : config.messageConsumeTimeout}
		);
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		// service endpoints
		priv.config = config;
		priv.wallclockservice_udp = services.wallclockservice_udp;
		priv.wallclockservice_ws = services.wallclockservice_ws;
		priv.mosquitto = services.mqttbroker;
		priv.redis = services.redis;
		
		this.id = uuidv4();
		this.queueName = config.SyncControllerQueueName;		
		logger = Logger.getNewInstance(process.env.loglevel);		

		priv.redisClient = RedisConnection("DEFAULT", priv.redis);
		priv.redisClient.on("error", function (err) {
			logger.error("Redis connection Error : " + err);
		});
		logger.info("connected to Redis endpoint " + JSON.stringify(config.redis));

		priv.msgAdapter = new MessagingAdapter(priv.mosquitto.host, priv.mosquitto.port, "synccontroller_" + this.id);
		priv.msgAdapter.on("connectionestablished", handleAdapterConnected.bind(null, priv.mosquitto));
		priv.msgAdapter.on("connectionfailure", handleAdapterConnectionFailure);
			
		priv.messenger = new Messenger(priv.msgAdapter);
		// priv.messenger.on("request", handleIncomingRequest.bind(self));
		// priv.messenger.on("message", handleIncomingMessage.bind(self));
	}

	// ---------------------------------------------------------

	/**
	 * Start to process events from the wait queue
	 * 
	 */
	start()
	{
		super.run();
	}

	// ---------------------------------------------------------

	stop()
	{
		if (super.isRunning())
			super.stop();
	}

	// ---------------------------------------------------------

	consume(message, cb) {
		try {
			// console.log("RECEIVED MESSAGE FROM QUEUE: ");
			// console.log(message);
	
			var buf = Buffer.from(message.event, "base64");
			var bytes = this.toArrayBuffer(buf);

			var e =  proto.SyncEvent.deserializeBinary(bytes);
			var eventHeader = e.getHeader();
			var eventBody;
			
			switch (eventHeader.getEventtype()) {

			case proto.EventType.NEW_SYNC_TIMELINE:
				eventBody =  proto.NewSyncTLEvent.deserializeBinary(e.getBody());
				logger.info("received new-timeline-added event: timelineId: %s, sync? %d ", eventBody.getTimelineid(), eventBody.getUseforsessionsync());

				handleTimelineChangeEvent.call(this, eventHeader, eventBody).then(()=>{
					logger.info("New-timeline-added event for timelineId: %s processed. ", eventBody.getTimelineid());
				});
				break;
			case proto.EventType.DEL_SYNC_TIMELINE:
				eventBody =  proto.DelSyncTLEvent.deserializeBinary(e.getBody());
				logger.info("received timeline-deleted event. timelineId: %s", eventBody.getTimelineid());
				handleTimelineChangeEvent.call(this, eventHeader, eventBody).then(()=>{
					logger.info("timeline-deleted event for timelineId: %s processed. ", eventBody.getTimelineid());
				}).catch((err)=>{
					logger.error("timeline-deleted event for timelineId: %s processing error %s ", eventBody.getTimelineid(), err);
				});
				break;
			
			case proto.EventType.TL_STATE_CHANGE:

				eventBody =  proto.TimelineStateChange.deserializeBinary(e.getBody());
				logger.info("received timeline-state-change event for timelineId: %s", eventBody.getTimelineid());
				handleTimelineStateChangeEvent.call(this, eventHeader, eventBody).then(()=>{
					logger.info("timeline-state-change event for timelineId: %s processed. ", eventBody.getTimelineid());
				}).catch((err)=>{
					logger.error("timeline-state-change event for timelineId: %s not processed successfully. ", eventBody.getTimelineid());
				});
				break;

			default:
				logger.info("Event type %d not handled", eventHeader.getEventtype());	
			}
		} catch (error) {
			logger.error(error);
		}
		cb();
	}


	toArrayBuffer(buffer) {
		var ab = new ArrayBuffer(buffer.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
		}
		return ab;
	}

} // end of class definition

// ---------------------------------------------------------
//  Private methods
// ---------------------------------------------------------

/**
 * Callback method for mqtt client
 * @param {pbject} serviceEndpoint 
 */
function handleAdapterConnected (serviceEndpoint) {
	logger.info("Connected to mqtt broker:", serviceEndpoint.host + ":" + serviceEndpoint.port);
}

// ---------------------------------------------------------
/**
 * Callback method for mqtt client
 * @param {object} error 
 */
function handleAdapterConnectionFailure (error) {
	logger.error(error);

}

// ---------------------------------------------------------

/**
 * Handle a timeline addition or deletion event
 * @param {object} eventHeader  
 * @param {object} payload 
 */
function handleTimelineChangeEvent(eventHeader, payload)
{
	var self = this;
	var priv = PRIVATE.get(self);
	var ds = priv.redisClient;
	var sessionId = eventHeader.getSessionid();
	var source = payload.getContentid();
	var type = payload.getTimelinetype();

	logger.debug("Running SyncTL-election algorithm for session %s, source %s and timeline-type %s", sessionId, source, type);

	return new Promise((resolve) =>{

		Session.getFromDataStore(sessionId, ds).then((session)=>{

			return electSyncTL.call(self, session, source, type);		
	
		}).then(()=>{
			resolve();
		}).catch((error)=>{
			logger.info("Handling TimelineChangeEvent, syncTL election returned: %s", error);
			resolve();
		});
	});
}

// ---------------------------------------------------------


/**
 * Handle a timeline state change event (e.g. a speed or position change)
 * @param {object} eventHeader  
 * @param {object} payload 
 */
function handleTimelineStateChangeEvent(eventHeader, payload)
{
	var self = this;
	var priv = PRIVATE.get(self);
	var ds = priv.redisClient;
	var sessionId = eventHeader.getSessionid();
	var session;

	return new Promise((resolve) =>{

		// check if timeline is a base-timeline for a synctimeline
		Session.getFromDataStore(sessionId, ds).then((s)=>{
			session = s;
			logger.debug(" ------------- handleTimelineStateChangeEvent() ----------- ");

			if ((session.synctlStrategy === SyncTLElection.EARLIEST_FIRST) ||
				(session.synctlStrategy === SyncTLElection.LOWEST_DISPERSION)){

				return handleTimelineStateChangeSimple.call(self, session, eventHeader, payload);
			}
			else if (session.synctlStrategy === SyncTLElection.DYNAMIC)
			{
			
				return handleTimelineStateChangeEventDynamic.call(self, session, eventHeader, payload);
			}
			else{
				return false;
			}
		}).then((result)=>{
			logger.debug(" ------------- ------------------------------- ----------- ");
			resolve(result);
		}).catch((error)=>{
			logger.info("Handling TimelineChangeEvent error: %s", error);
			resolve(false);
		});
	});
}

// ---------------------------------------------------------


/**
 * Update synctimeline with timeline state change event only if synctimeline.parent is the 
 * timeline that just changed (i.e. reported by the event)
 * @param {object} eventHeader  
 * @param {object} payload 
 */
function handleTimelineStateChangeSimple(session, eventHeader, payload)
{
	var self = this;
	var priv = PRIVATE.get(self);
	var ds = priv.redisClient;
	var source = payload.getContentid();
	var type = payload.getTimelinetype();
	var timelineId = payload.getTimelineid();
	var timeline, syncTL;

	return new Promise((resolve, reject) =>{

		// check if timeline is a base-timeline for a synctimeline
		session.getSyncTimelineForSourceType(source, type).then((synctimeline)=>{
			syncTL = synctimeline;				
			return session.getTimeline(timelineId);
		}).then((t)=>{
			timeline = t;
			
			if ((syncTL) && (syncTL.parentTL === timelineId)) {
				logger.debug("Timeline %s is driver of sync timelines?  YES", timeline.id);

				//get presentation timestamp from TimelineStateChangeEvent
				var actualPT = payload.getActual();
				// var earliestPT = payload.getEarliest();
				// var latestPT = payload.getLatest();

				syncTL.lastTimestamp.wallclockTime = actualPT.getWallclocktime();
				syncTL.lastTimestamp.contentTime = actualPT.getContenttime();
				syncTL.lastTimestamp.speed = actualPT.getSpeed();
				sendTimelineUpdate.call(self, syncTL);
				logger.debug("Update synctimeline.lastTimestamp with new timestamp %s", JSON.stringify(syncTL.lastTimestamp));
				syncTL.persist(ds);
			}			
			else if ((syncTL) && (syncTL.parentTL !== timelineId))
				logger.debug("Timeline %s is driver of sync timelines?  NO", timelineId);
			else
				logger.debug("no sync timeline available for source % and timelinetype %s", source, type);

			resolve(true);
		}).catch((error)=>{
			logger.info("handleTimelineStateChangeSimple() : event handling error %s", error);
			reject(error);
		});
	});
}

// ---------------------------------------------------------


function handleTimelineStateChangeEventDynamic(session, eventHeader, payload)
{
	var self = this;
	var priv = PRIVATE.get(self);
	var ds = priv.redisClient;
	var source = payload.getContentid();
	var type = payload.getTimelinetype();
	var timelineId = payload.getTimelineid();
	var timeline, syncTL, electedBaseTL;

	return new Promise((resolve, reject) =>{

		session.getSyncTimelineForSourceType(source, type).then((synctimeline)=>{
			syncTL = synctimeline;				
			return session.getTimeline(timelineId);
		}).then((t)=>{
			timeline = t;
			
			// run timeline election algorithm to select latest changed-timeline
			return electSyncTL.call(self, session, timeline.contentId, timeline.timelineType);		
		}).then((electTL)=>{
			electedBaseTL = electTL;

			if (electedBaseTL && (electedBaseTL.id !== timelineId))
			{
				timeline = electedBaseTL;
			}

			if (syncTL.isSignificantChange(timeline.lastTimestamp, kTimelineChangeThreshold, 1e3))
			{
				syncTL.parentTL = timeline.id;
				syncTL.providerId = timeline.providerId;
				syncTL.writable = timeline.writable;
				syncTL.parentTLCorr = timeline.parentTLCorr;
				syncTL.lastTimestamp = timeline.lastTimestamp;
				sendTimelineUpdate.call(self, syncTL);
				syncTL.persist(ds);
			}
			resolve(true);
		}).catch((error)=>{
			logger.info("handleTimelineStateChangeEventDynamic() : event handling error %s", error);
			reject(error);
		});
	});
}


// ---------------------------------------------------------
// /**
//  * Handle a timeline state change event (e.g. a speed or position change)
//  * @param {object} eventHeader  
//  * @param {object} payload 
//  */
// function handleTimelineStateChangeEvent(eventHeader, payload)
// {
// 	var self = this;
// 	var priv = PRIVATE.get(self);
// 	var ds = priv.redisClient;
// 	var sessionId = eventHeader.getSessionid();
// 	var source = payload.getContentid();
// 	var type = payload.getTimelinetype();
// 	var timelineId = payload.getTimelineid();
// 	var actualPT = payload.getActual();
// 	var session,timeline, syncTL, electedBaseTL;

// 	return new Promise((resolve, reject) =>{

// 		// check if timeline is a base-timeline for a synctimeline
// 		Session.getFromDataStore(sessionId, ds).then((s)=>{
// 			session = s;
// 			logger.debug("handleTimelineStateChangeEvent(): get synctimeline ");
// 			return session.getSyncTimelineForSourceType(source, type);	
// 		}).then((synctimeline)=>{
// 			syncTL = synctimeline;				
// 			return session.getTimeline(timelineId);
// 		}).then((t)=>{
// 			timeline = t;
			
// 			if ((syncTL) && (syncTL.parentTL === timelineId)) {
// 				logger.debug("Timeline %s is driver of sync timelines?  YES", timeline.id);

// 				//get presentation timestamp from TimelineStateChangeEvent
// 				var actualPT = payload.getActual();
// 				// var earliestPT = payload.getEarliest();
// 				// var latestPT = payload.getLatest();

// 				syncTL.lastTimestamp.wallclockTime = actualPT.getWallclocktime();
// 				syncTL.lastTimestamp.contentTime = actualPT.getContenttime();
// 				syncTL.lastTimestamp.speed = actualPT.getSpeed();
// 				sendTimelineUpdate.call(self, syncTL);
// 				logger.debug("Update synctimeline.lastTimestamp with new timestamp %s", JSON.stringify(syncTL.lastTimestamp));
// 				syncTL.persist(ds);

// 			}
			
// 			else if ((syncTL) && (syncTL.parentTL !== timelineId))
// 				logger.debug("Timeline %s is driver of sync timelines?  NO", timelineId);
// 			else
// 				logger.debug("no sync timeline available for source % and timelinetype %s", source, type);

// 			resolve();
// 		}).catch((error)=>{
// 			logger.info("Handling TimelineChangeEvent, syncTL election returned: %s", error);
// 			resolve();
// 		});


// 	});
// }

/**
 * Elect a synchronisation timeline based on the set of available timelines for a source-type pair.
 * If a synchronisation timeline does not exist for the source-type pair, then 
 * @param {Session} session session to elect Sync Timeline for
 * @param {String} source timeline source e.g. contentId
 * @param {String} type timeline type
 */
function electSyncTL(session, source, type)
{
	var self = this;
	var priv = PRIVATE.get(self);
	var ds = priv.redisClient;
	
	if ((typeof session === "undefined") || (session === null) || !(session instanceof Session))
		throw new Error("electSyncTL - invalid session param");
	if ((typeof source === "undefined") || (source === null))
		throw new Error("electSyncTL - invalid source param");
	if ((typeof type === "undefined") || (type === null))
		throw new Error("electSyncTL - invalid type param");

	var syncTL = null;
	var baseTimeline = null;
	var syncTLChanged = false;
	
	
	
	return new Promise((resolve, reject) =>{

		// get TimelineSourceType key in session's sourceTypes list
		session.getTimelineSourceType(source, type).then((sourceType)=>{
			// if no timeline sourcetype is present, add it to session's sourcetypes list
			if (sourceType === null){
				return session.addTimelineSourceType(source,type);
			} 
			else
				return sourceType;
		}).then((sourceType)=>{
			if  ((typeof sourceType === "object" ) && (sourceType instanceof TimelineSourceType))
				return sourceType;
			else
				return session.getTimelineSourceType(source, type);
		}).then((sourceType)=>{
			// get timelines in relevant sourcetype list
			return sourceType.getTimelines();
		}).then((timelines)=>{
			// elect basetimeline for sync timeline according to strategy
			if ((timelines.length > 0)){
				baseTimeline = selectBaseTimeline(timelines, session.synctlStrategy);
				if (baseTimeline) 
					logger.debug("Timeline election returned : " , baseTimeline.id);
				else
					logger.debug("Timeline election returned : null {no timelines}");
			}

			// check if a sync timeline is already present for this source-type pair
			return session.getSyncTimelineForSourceType(source, type);

		}).then((synctimeline)=>{

			logger.debug("Fetching sync timeline ... " );
			if (synctimeline !== null) logger.debug("found sync timeline : " , synctimeline.id);
			else logger.debug("no sync timeline available , creating new sync timeline ...");

			syncTLChanged = false;

			// first scenario: no synctimeline created yet
			if ((synctimeline === null) && (baseTimeline!==null))
			{
				// create sync timeline using base timeline
				synctimeline = createSyncTimelineWithBase(baseTimeline);
				logger.debug("sync timeline created with parent : ", baseTimeline.id );
				// console.log(synctimeline);

				syncTL = synctimeline;
				syncTLChanged =  true;
				
			}else if ((synctimeline !== null) && (baseTimeline!==null))
			{
				// second scenario: synctimeline for source-type already present and a basetimeline has been elected
				// check if synctimeline's existing base timeline is different from elected base timeline
				if (synctimeline.parentTL !== baseTimeline.id){
					logger.debug("sync-timeline's base timeline has changed, updating sync-timeline's parentTL field.");
					synctimeline.parentTL = baseTimeline.id;
					synctimeline.providerId = baseTimeline.providerId;
					synctimeline.writable = baseTimeline.writable;
					synctimeline.parentTLCorr = baseTimeline.parentTLCorr;
					synctimeline.lastTimestamp = baseTimeline.lastTimestamp;
					syncTL = synctimeline;
					synctimeline.persist(ds);
					syncTLChanged =  true;
				}
				// else, election algorithm selected the same basetimeline as previously, we do nothing.

			}else if ((synctimeline === null) && (baseTimeline===null))
			{
				// third scenario: synctimeline is null and elected basetimeline is null
				logger.info("No synctimeline available or created.");

			}else if ((synctimeline !== null) && (baseTimeline===null))
			{
				if (session.synctlStrategy !== SyncTLElection.USE_ALL)
				{
					syncTL = null;
					syncTLChanged =  true;
					logger.info("No basetimelines available. Deleting synctimeline.");
					return session.removeSyncTimeline(synctimeline.id);
				}else
					logger.info("Unsupported feature: synctimeline does not have a single parent. synctimeline not updated. ");
			}
			return syncTL;

		}).then((syncTimeline)=>{
			// update and overwrite this synctimeline in the session
			if ((syncTimeline) && (syncTimeline instanceof Timeline)) 
			{
				return session.addSyncTimeline(syncTimeline, true);
			}else
				return syncTLChanged;
		}).then(()=>{

			logger.debug("sync timeline changed? " , syncTLChanged ? "Yes" : "No");

			// if  a sync timeline was created or modified, push a new PresentationTimestamp into the timeline's channel
			if (syncTLChanged && syncTL !== null){

				sendTimelineUpdate.call(self, syncTL);
				return sendSyncTimelinesAvailable.call(self, session);

			}else if (!syncTLChanged && syncTL === null){
				return sendSyncTimelinesAvailable.call(self, session);
			}
			else if (syncTLChanged && syncTL === null){
				return sendSyncTimelinesAvailable.call(self, session);
			}
			else
				return false;
		}).then(()=>{
			resolve();
		}).catch((err)=>{
			logger.info("electSyncTL failed :", err);
			reject(err);
		});

	});	

}

// ---------------------------------------------------------

/**
 * From the available list of timelines, select one to use as base timeline to drive a synchronisation timeline
 * 
 * @param {array} timelines array of Timeline objects 
 * @param {number} policy SyncTLElection enumeration value
 */
function selectBaseTimeline(timelines, policy)
{
	if (!(Array.isArray(timelines)) || (typeof(policy)==="undefined"))
		throw new Error("invalid param");
	policy = (typeof policy === "string") ? parseInt(policy) : policy;

	if(policy === SyncTLElection.EARLIEST_FIRST)
	{
		logger.debug("____________ EARLIEST_FIRST MODE _____________");
		let dateNow = new Date();
		let diff = 0;
		let timeline = timelines[0];
	
		for (const t of timelines) {

			let dateCreated = new Date(t.createdOn);
			let newdiff = dateNow - dateCreated; 

			if (newdiff > diff)
			{
				diff = newdiff;
				timeline = t;
			}
		}

		return timeline;

	}else if(policy === SyncTLElection.LOWEST_DISPERSION)
	{
		logger.debug("____________ LOWEST_DISPERSION MODE _____________");
		// timelines already sorted on dispersion
		return timelines[0];
	}else if(policy === SyncTLElection.DYNAMIC)
	{
		logger.debug("____________ DYNAMIC MODE _____________");
		// select timeline with the most recent lastTimestamp
		// The lastTimestamp property of a timeline is updated by the TimelineObserver if a significant change over the previous lastTimestamp value is observed
		let maxWallClockTime = 0;
		let temp =  null;

		for (const t of timelines) {

			// console.log(t);

			if  (t.lastTimestamp.wallclockTime > maxWallClockTime)
			{
				maxWallClockTime = t.lastTimestamp.wallclockTime;
				temp = t;
			}
		}
		return temp;
	}
	else if(policy === SyncTLElection.USE_ALL)
	{
		return null;
	}
}

// ---------------------------------------------------------

function createSyncTimelineWithBase(parentTL)
{
	var syncTimelineId = "urn:" + parentTL.sessionId + ":" + uuidv4();
	var syncTlChannel = "Sessions/" + parentTL.sessionId + "/timelines/" + syncTimelineId + "/state";

	var correlation = { parentTime: parentTL.lastTimestamp.wallclockTime,
		childTime: parentTL.lastTimestamp.contentTime,
		initialError: parentTL. parentTLCorr.initialError,
		errorGrowthRate: 0.0,
		speed: parentTL.lastTimestamp.speed
	};

	
	var synctimeline = new Timeline(syncTimelineId, parentTL.sessionId, 
		parentTL.contentId, parentTL.timelineType, parentTL.frequency, 
		syncTlChannel, parentTL.providerId, "synccontroller", 
		parentTL.useForSessionSync, parentTL.writable, parentTL.id, 
		correlation , parentTL.lastTimestamp);
	

	return synctimeline;
}

// ---------------------------------------------------------

/**
 * Publish a TimelineUpdate message to a timeline's update channel
 * @param {Timeline} timeline a Timeline object 
 */
function sendTimelineUpdate(timeline) {
    
	if ((typeof timeline === "undefined") || (timeline === null) || !(timeline instanceof Timeline)){
		logger.error("sendTimelineUpdate - invalid timeline parameter");
		return;
	}
	
	var priv, message;
	priv = PRIVATE.get(this);
	
	var timeObject = {
		earliest : {contentTime: timeline.lastTimestamp.contentTime , wallclockTime: timeline.lastTimestamp.wallclockTime, speed: timeline.lastTimestamp.speed},
		actual : {contentTime: timeline.lastTimestamp.contentTime , wallclockTime: timeline.lastTimestamp.wallclockTime, speed: timeline.lastTimestamp.speed},
		latest : {contentTime: timeline.lastTimestamp.contentTime , wallclockTime: timeline.lastTimestamp.wallclockTime, speed: timeline.lastTimestamp.speed},
	};
	logger.debug("sendTimelineUpdate: publishing this timestamp in synctimeline channel:", JSON.stringify(timeObject));
	// console.log(timeObject);

	message = MessageFactory.create(
		"TimelineUpdate",
		timeline.sessionId,
		timeline.providerId,
		timeline.id,
		timeline.timelineType,
		timeline.contentId,
		new PresentationTimestamp(timeObject),
		null,
		"0.0.1"
	);
	//  { qos: 0, retain: true }
	priv.messenger.send(message, timeline.channel, { qos: 0, retain: true });
	logger.debug("sendTimelineUpdate: sent  message to channel %s", timeline.channel);
}

// ---------------------------------------------------------

function sendSyncTimelinesAvailable(session)
{
	var self = this;
	var priv, message;
	priv = PRIVATE.get(self);

	if ((typeof session === "undefined") || (session === null) || !(session instanceof Session)){
		logger.error("sendSyncTimelinesAvailable - invalid session parameter");
		return;
	}

	return new Promise((resolve, reject) =>{

		Session.getFromDataStore(session.id, priv.redisClient).then((sessionReloaded)=>{

			if (sessionReloaded === null) return []; // return empty list of synctimelines
			else return sessionReloaded.getSyncTimelines();

		}).then((timelines)=>{

			// console.log(timelines);
			var timelinesInfo = [];	
	
			for (let t of timelines) {
				if (t instanceof Timeline){
					var ti = t.getInfo();
					timelinesInfo.push(ti);			
				}				
			}	
			message = MessageFactory.create(
				"SyncTimelinesAvailable",
				session.id,
				timelinesInfo,
				null,
				"0.0.1"
			);
		
			priv.messenger.send(message, session.channel);
			logger.debug("sendSyncTimelinesAvailable: sent  message to topic: ", session.channel);
			resolve(true);
		}).catch((err)=>{reject(err);});
	});
} 



// ---------------------------------------------------------

// --------------------------------------------------

/**
 * Build and send a request message to a target channel
 * @param {string} type 
 * @param {*} sessionId 
 * @param {*} contextId 
 * @param {*} senderId 
 * @param {*} replyChannel 
 * @param {*} destinationChannel 
 * @param {*} onresponse 
 * @param {*} options 
 */
function sendRequest (type, sessionId, contextId, senderId, replyChannel, destinationChannel, onresponse, options) {
    
	var args, priv, i, j, request;

	priv = PRIVATE.get(this);


	args = [];
	args[0] = type;
	args[1] = sessionId;
	args[2] = contextId;
	args[3] = senderId;
	args[4] = replyChannel;

	i = 4;
	j=8;

	// Add optional arguments
	if (arguments.length > 7) {
		for (; j < arguments.length; j++, i++) {
			args[i+1] = arguments[j];
		}
	}

	args[i+1] = MessageIdGenerator.getNewId();
	args[i+2] = "0.0.1";
	// console.log(args);
	request = MessageFactory.create.apply(null, args);
	priv.messenger.sendRequest(request, destinationChannel, onresponse, options);

	return request;
}


// ---------------------------------------------------------
// Utility methods
// ---------------------------------------------------------




SyncController.queueName =kSyncControllerQueueKey;
module.exports = SyncController;