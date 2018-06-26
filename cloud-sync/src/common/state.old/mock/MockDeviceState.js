var Device, WeakMap, TimelineMap, PRIVATE;

WeakMap = require("weak-map");
PRIVATE = new WeakMap;
TimelineMap = require("../common/timeline/Timelines");

Device = function (deviceId) {
	PRIVATE.set(this, {
        deviceId: deviceId,
        contentId: null,
        timelines: new TimelineMap()
    });
};

Object.defineProperties(Device.prototype, {
    "deviceId": {
        get: function () { return PRIVATE.get(this).deviceId; },
        set: function (deviceId) { PRIVATE.get(this).deviceId = deviceId; }
    },
    "contentId": {
        get: function () { return this.getContentId(); },
        set: function (contentId) { return this.setContentId(contentId); }
    },
    "timelines": {
        get: function () { return this.getTimelines(); }
    }
});

Device.prototype.getContentId = function () {
    return PRIVATE.get(this).contentId;
};

Device.prototype.setContentId = function (contentId) {
    PRIVATE.get(this).contentId = contentId
};

Device.prototype.getTimelines = function () {
    return PRIVATE.get(this).timelines; // Return copy
};

// Device.prototype.setTimeline = function (timeline) {

//     var priv, i;

//     priv = PRIVATE.get(this);
//     i = this.indexOfTimeline(timeline);

//     if (i === -1) {
//         priv.timelines.push(timeline);
//     }

//     else {
//         priv.timelines[i] = timeline;
//     }
// };

// Device.prototype.indexOfTimeline = function (timeline) {
    
//     var priv, res;
    
//     priv = PRIVATE.get(this);
//     res = -1;

//     priv.timelines.forEach(function (elem, i) {
//         if (elem === timeline) {
//             res = i;
//         }
//     });

//     return res;
// };

// Device.prototype.removeTimeline = function (timeline) {
//     var i = this.indexOfTimeline(timeline);
//     if (i > -1) { PRIVATE.get(this).timelines.splice(i, 1) };
// };

module.exports = Device;