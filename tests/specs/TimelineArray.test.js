var TimelineArray = require("TimelineArray");
var Timeline = require("Timeline");
var DateNowClock = require("dvbcss-clocks").DateNowClock;
var CorrelatedClock = require("dvbcss-clocks").CorrelatedClock;


var wallclock = new DateNowClock();
var clock = new CorrelatedClock(wallclock);

var timelineArray = null;
var timeline1 = new Timeline("timeline1", "type1", "content1", clock);
var timeline2 = new Timeline("timeline2", "type2", "content2", clock);
var timeline3 = new Timeline("timeline3", "type3", "content3", clock);

describe("TimelineArray", function () {

    beforeEach(function () {
        timelineArray = new TimelineArray();
        timelineArray.push(timeline1);
        timelineArray.push(timeline2);
        timelineArray.push(timeline3);
    });

    it ("Exists", function () {
        expect(TimelineArray).toBeDefined();
    });

    it ("Adds unknown timelines", function () {
        var timeline = new Timeline("timeline", "type", "content", clock);
        timelineArray.add(timeline);
        expect(timelineArray.length).toEqual(4);
    });

    it ("Does not add known timelines", function () {
        timelineArray.add(timeline1);
        expect(timelineArray.length).toEqual(3);
    });

    it ("Throws on attempt to add an object that is not an instance of timeline", function () {
        expect(function () {
            timelineArray.add({});
        }).toThrow();
    });

    it ("Removes known timelines", function () {
        timelineArray.remove(timeline1);
        expect(timelineArray.length).toEqual(2);
    });

    it ("Does not remove unknown timelines", function () {
        var timeline = new Timeline("timeline", "type", "content", clock);
        timelineArray.remove(timeline);
        expect(timelineArray.length).toEqual(3);
    });

    it ("Throws on attempt to remove an object that is not an instance of timeline", function () {
        expect(function () {
            timelineArray.remove({});
        }).toThrow();
    });

    it ("Finds a known timeline by id and returns null otherwise", function () {
        var timeline = timelineArray.getById(timeline1.timelineId);
        expect(timeline).toEqual(timeline1);

        timeline = timelineArray.getById("unknownId");
        expect(timeline).toEqual(null);
    });

    it ("Finds timelines by timeline type and returns an empty TimelineArray otherwise", function () {
        var timelines = timelineArray.getByTimelineType(timeline1.timelineType);
        expect(timelines[0]).toEqual(timeline1);

        timelines = timelineArray.getByTimelineType("unknownTimelineType");
        expect(timelines.length).toEqual(0);
    });

    it ("Finds timelines by content id and returns an empty TimelineArray otherwise", function () {
        var timelines = timelineArray.getByContentId(timeline1.contentId);
        expect(timelines[0]).toEqual(timeline1);

        timelines = timelineArray.getByContentId("unknownContentId");
        expect(timelines.length).toEqual(0);
    });

});