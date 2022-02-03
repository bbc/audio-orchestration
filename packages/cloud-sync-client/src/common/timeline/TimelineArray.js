var Timelines, Timeline, inherits;

inherits = require("inherits");
Timeline = require("./Timeline");

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
