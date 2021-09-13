# Synchronisation Service Client Library

``CloudSynchroniser`` is a JS implementation of the client library API for the Synchronisation Service (a.k.a cloud-sync).



### Version
Version `2.0.0`


### What's New From v1.0.0
* **Synchronisation Timelines**: A `synchronisation timeline ` is a service-generated timeline based on timelines of the same type and origin (i.e. same timelineType and contentId). Clients can only subscribe to synchronisation timelines as opposed to individual timelines.`TimelineInfo`
* **Synchronisation Timeline Election:** A Synchronisation Timeline's state (timestamp) is updated by applying an election algorithm to the list of available candidate timelines. Candidate timelines WILL have the same ```timelineType``` and ```contentId``` values as the sync timeline. The algorithm selects which candidate timeline's state to use to compute the synchronisation timeline's new state. This algorithm runs dynamically and will be triggered when
    * timelines are registered or removed
    * one of the registered timelines' state has changed significantly (beyond a threshold of *40 ms* or speed has changed)

### Dependencies
* [dvbcss-clocks](https://github.com/bbc/dvbcss-clocks) (Available as an NPM package)
* MQTT Client library : [paho-mqtt](https://www.npmjs.com/package/paho-mqtt)   v1.0.3 (Available as an NPM package)


### Sync Service Endpoints (for testing)

* Sync Service (v2.0.0): 


### Build the Synchronisation Service Client Library
If you wish to build it into a single JS file suitable for the browser (i.e. for including in a webpage) then do this:

```
$ grunt
```
The resulting JS client library is placed in [dist/browser/Cloud-SyncKit.js](../../dist/browser/Cloud-SyncKit.js).



---
## CloudSynchroniser API
### 1. Provide/Remove Timelines for Sync
* `URN addTimelineClock(clock, timelineType, timelineId)`
* `synchronise(clock, timelineType, contentId)`
* ~~`URN addTimelineSource(mediaObject, timelineType, contentId)`~~
* `removeTimeline(timelineURN)`

### 2. Find Timelines to Sync 
* `Promise<TimelineInfo[]> getAvailableTimelines()`

### 3. Subscribe and get a Timeline Clock
* `subscribeTimeline(String timelineUrn)`
* `disableTimelineSync(String timelineUrn)`


### 4. Sync To Timeline
* `syncClockToThisTimeline(clock, timelineURN, correlation)`

### 5. Events

|  Event                                  | Description                                           |
|-----------------------------------------|------------------------------------------------|
| `DeviceRegistrationSuccess`             | client successfully registered with service    |
| `DeviceRegistrationError`               | client registration failure    |
| `WallClockAvailable`                    | Local WallClock synchronised to WallClock service    |
| `WallClockUnAvailable`                  | Local WallClock not sync'ed to WallClock service    |
| `SyncServiceUnavailable`                | Connection to Sync Service failed   |
| `TimelineAvailable`                     | A requested timeline shadow is available. Includes `Timeline` property which provides a  [dvbcss-clocks clock](https://github.com/bbc/dvbcss-clocks/blob/master/src/CorrelatedClock.js)  object as the local estimate of the timeline   |
| `SyncTimelinesAvailable`                | Array of ``TimelineInfo``* objects representing the synchronisation timelines currently available    |
| `SyncTimelinesUnavailable`              | *Deprecated*       |
| `LowSyncAccuracy`             | Emitted when sync accuracy drops below threshold (specified when ```CloudSynchroniser``` object is created)    |
                                  



### `TimelineInfo` object

 `TimelineInfo` is an object including properties for a given timeline (identified by ```timelineId```).

 Example:

```javascript
{
    timelineId: "urn:123:fd24c9ef-2a7f-4622-9de2-41f7bd38fd85", 
    sessionId : "123",
    timelineType: "tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000",
    frequency: 1000,
    contentId: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    channel: "Sessions/123/timelines/urn:123:fd24c9ef-2a7f-4622-9de2-41f7bd38fd85/state",
    providerId: "820b504b-91f9-484f-a3e0-91a2c09e39b2",
    providerType: "synccontroller",
    useForSessionSync: true,
    available: true,
    createdOn: "2018-06-11T11:20:01.614Z"
};
```

---
# Usage Summary

## 1. Create a CloudSynchroniser object

Use the factory ```getCloudSynchroniser()``` method to create a CloudSynchroniser object and register the client to the Sync Service via a known endpoint (```syncUrl``` parameter).

To join an existing synchronisation session, use the same ```sessionId``` for all your clients. The  ```deviceId``` parameter identifies the client and is of type ```string```. It needs to be unique within the session.

The ```options``` parameter is an object specifying preferences such as the sync mode.  


```javascript
// Require cloud-synchroniser module
var cloudSyncKit = require("CloudSyncKit");

var syncUrl = "mqttbroker.edge.platform.2immerse.eu"; // a Sync Service MQTT endpoint
var sessionId = "223dsf452asd"; // a globally-unique session identifier
var deviceId = "chris_iphone"; // a client identifier 
var options = { syncTimelineElection: cloudSyncKit.SyncTLElection.DYNAMIC }; // options e.g. desired sync mode

// Create cloud synchroniser
var synchroniser = cloudSyncKit.getCloudSynchroniser(syncUrl, sessionId, deviceId, options);

```


### 1.1. Sync Modes


|  Sync Mode              |    Value   | Description                                    |
|-------------------------|------------|------------------------------------------------|
| `EARLIEST_FIRST`        |     1      | First-to-join master mode. The sync timeline is locked to the timeline that was registered first for this session.    |
| `LOWEST_DISPERSION`     |     2      | Closest-client master mode. The sync timeline state is computed from the state of the timeline with the lowest reported dispersion (RTT) value.     |
| `DYNAMIC`               |     4      | No master mode. The sync timeline state is computed from the timeline to have undergone the most recent  significant state-change. i.e. any client can change the state of the sync timeline as long as it exports a timeline of the same type and origin (same ```timelineType``` and ```contentId```) |


### 1.2 Registration Success And WallClock Availability

`DeviceRegistrationSuccess` and  `DeviceRegistrationError` events are emitted by the CloudSynchroniser object to indicate registration success or failure respectively.

A `SyncServiceUnavailable` event is emitted if the connection to the Sync Service is unsuccessful.

After successful registration, the `CloudSynchroniser` initialisation phase completion is indicated by  `WallClockAvailable` event. A synchronised wallclock is now available as the `wallclock` property of the `CloudSynchroniser` object.


```javascript

synchroniser.on("WallClockAvailable", function () { 

    console.info("wallclock time:", synchroniser.wallclock.now()); 

});

```


## 2.  Register a local timeline for sync

It is recommended to use a [dvbcss-clocks clock](https://github.com/bbc/dvbcss-clocks) object to drive a media player and use that clock object to register the timeline. This provides more accurate reporting of the timeline progress; timestamps read from the clock object are more accurate than from the media player itself.

The library doesn't currently support registering a media player as a timeline source (this will be added to the API if there is a demand for it).

### 2.1 Create a clock object for the media element's timeline

Create a clock object using the CloudSynchroniser's `wallclock` as parent clock.


```javascript


var videoClock = new CorrelatedClock(synchroniser.wallclock, {
        tickRate: 1000,  // timeline units in milliseconds
        correlation: new Correlation({
            parentTime: synchroniser.wallclock.now(),
            childTime: videoElement.currentTime * 1000
        })
    });
```

### 2.2 Slave your media player to the created clock 

Once registered with the Sync Service, your clock object will be updated dynamically by the service. The media player needs to be kept synchronised with the clock object. You can use the Adaptive Media Playback algorithm to locally sync the media player to the clock. This is more suitable for video. For audio, a seek might be the best option.

* An example of a clock object locked to a video element is found in `examples/synchronisedvideo/src/js/VideoClock.js`
* An implementation of the Adaptive Media Playback algorithm is found in the Synchronised Video example app: `examples/synchronisedvideo/src/js/VideoSynchroniser.js`


### 2.3 Register the clock with the CloudSynchroniser

#### - `synchronise()`
Use CloudSynchroniser's `synchronise()` method to register a timeline to be used for session-wide synchronisation.
This ensures that the clock object is locked to the session-wide synchronisation timeline (generated by the service when a timeline is registered) and that the sync timeline is advertised to all clients.


```javascript
var  timelineType = "tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000";
synchroniser.synchronise(videoClock, timelineType, video.currentSource().src);
```

* `timelineType` parameter

    This is a URN string for this type of timeline and it is recommended to follow the naming scheme for DVB-CSS Timeline Selector (Section 5.3.3 of [ETSI TS 103 286-2](http://www.etsi.org/deliver/etsi_ts/103200_103299/10328602/01.02.01_60/ts_10328602v010201p.pdf)). You can make your own (and use any string you like)!
    
    For MPG-DASH:
    * `"urn:dvb:css:timeline:mpd:period:rel:<ticks-per-second>" `
    * `"urn:dvb:css:timeline:mpd:period:rel:<ticks-per-second>:<period-id>"`

    For media based on the ISOBMFF format:
    * `"urn:dvb:css:timeline:ct"`

* `contentId` parameter

    This is a string that specifies the source of the timeline. Use the media source (e.g. the media URL) if available. If the timeline's source is not a media element, use a string that will be unique in this session e.g. `"my_experience_timeline_clock"`


#### - `addTimelineClock()`
You can also use the CloudSynchroniser's `addTimelineClock()` method to register a timeline for session-wide sync. Set `useForSessionSync` as `true` in the `options` parameter.

```javascript
    var options = {
        useForSessionSync: true
    };

    synchroniser.addTimelineClock(videoClock, timelineType, video.currentSource().src, options)
    .then((timelineId)=>{
        console.log("timeline registered, id: ", timelineId);
    });
```

**TODO**:
- [ ] check returned Promise from `addTimelineClock()`



## 3.  Find a timeline to sync with

You can discover timelines available for sync by 

EITHER
*  Listening for the `SyncTimelinesAvailable` event

    This event contains an array of `TimelineInfo` objects representing the synchronisation timelines currently available.

OR

* Calling the `getAvailableTimelines()` API method

    `getAvailableTimelines()` asynchronously returns (via a Promise) an array of available timelines (`TimelineInfo` objects). 

    ```javascript
        synchroniser.getAvailableTimelines()
        .then((timelines)=>{
            console.log(timelines);
        });
    ```

A `TimelineInfo` instance contains properties that describe/identify a timeline. Use `timelineType` and `contentId` to look for a timeline to sync with. The selected timeline is identified by the `timelineId` property.

## 4. Subscribe to a selected timeline

Use `subscribeTimeline()` to subscribe to a timeline using its `timelineId`. When the timeline is available locally, a `TimelineAvailable` event is fired by the CloudSynchroniser object (containing the ).

 ```javascript
    
    var timelineClock, timelineId = "selected_timeline_id";
    
    // subscribe to timeline and wait for TimelineAvailable event
    synchroniser.subscribeTimeline(timelineId)
    .then((responseCode)=>{
        if responseCode === 0 console.log("success");
    });

    // Handle TimelineAvailable event and retrieve clock object
    synchroniser.on("TimelineAvailable", function (id) {
       if (id===timelineId) 
            timelineClock = synchroniser.getTimelineClockById(timelineId);

            timelineClock.on("change", updateVideoPlayer());
    });
```


## Documentation

JSDoc documentation can be built:

    $ grunt jsdoc

Documentation is generated and output as HTML into the `doc` subfolder.


## Authors

 * Rajiv Ramdhany (BBC)
 * Christoph Ziegler (IRT)
