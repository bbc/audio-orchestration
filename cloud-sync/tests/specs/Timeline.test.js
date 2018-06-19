var Timeline = require("Timeline");
var DateNowClock = require("dvbcss-clocks").DateNowClock;
var Correlation = require("dvbcss-clocks").Correlation;
var CorrelatedClock = require("dvbcss-clocks").CorrelatedClock;
var Timestamp = require("Timestamp");

var wallclock = new DateNowClock();
var clock = new CorrelatedClock(wallclock);
var timelineId = "urn:unique:timeline:id";
var timelineType = "urn:unique:timeline:type";
var frequency = 10000;
var contentId = "urn:unique:content:id";
var updateChannel = "/path/to/client/timelineId";
var thresholdSecs = .04;
var useForSessionSync = true;
var writable = true;

describe ("Timeline", function () {

    it ("Exists", function () {
        expect(Timeline).toBeDefined();
    });

    it ("Creates a Timeline object with mandatory parameters", function () {
        var timeline = new Timeline(timelineId);
        expect(timeline).toEqual(jasmine.any(Timeline));
        expect(timeline.timelineId).toEqual(timelineId);
        expect(timeline.timelineType).toEqual(null);
        expect(timeline.frequency).toEqual(1000);
        expect(timeline.contentId).toEqual(null);
        expect(timeline.clock).toEqual(null);
        expect(timeline.updateChannel).toEqual(null);
        expect(timeline.useForSessionSync).toEqual(false);
        expect(timeline.writable).toEqual(true);
    });

    it ("Creates a Timeline object with mandatory and optional parameters", function () {
        
        var timeline = new Timeline(timelineId, {
            timelineType: timelineType,
            frequency: frequency,
            contentId: contentId,
            clock: clock,
            updateChannel: updateChannel,
            thresholdSecs: thresholdSecs,
            useForSessionSync: useForSessionSync,
            writable: writable
        });

        expect(timeline).toEqual(jasmine.any(Timeline));
        expect(timeline.timelineId).toEqual(timelineId);
        expect(timeline.timelineType).toEqual(timelineType);
        expect(timeline.contentId).toEqual(contentId);
        expect(timeline.clock).toEqual(clock);
        expect(timeline.updateChannel).toEqual(updateChannel);
        expect(timeline.thresholdSecs).toEqual(thresholdSecs);
        expect(timeline.useForSessionSync).toEqual(useForSessionSync);
        expect(timeline.writable).toEqual(writable);
    });

    it ("Throws if mandatory parameters are missing", function () {
        function create () {
            return new Timeline();
        }
        expect(create).toThrow();
    });

    it ("Updates clock if change significant", function () {
        var timeline, correlation, timelineClock, presentationTimestamp, onChangeSpy, updated;

        onChangeSpy = jasmine.createSpy("onChangeSpy");

        // Create timeline and listen for lock changes
        timeline = new Timeline(timelineId, {
            timelineType: timelineType,
            contentId: contentId,
            clock: clock,
            updateChannel: updateChannel,
        });
        timeline.clock.on("change", onChangeSpy);
        expect(onChangeSpy).not.toHaveBeenCalled();

        // Update the timeline clock (significant change)
        correlation = new Correlation({ parentTime: 0, childTime: 1000 });
        timelineClock = new CorrelatedClock(wallclock, { correlation: correlation });
        timestamp = new Timestamp(timelineClock, wallclock);
        updated = timeline.update(timestamp);
        expect(onChangeSpy.calls.count()).toEqual(1);
        expect(updated).toEqual(true);

        // Update the timeline clock (no significant change)
        correlation = new Correlation({ parentTime: 0, childTime: 1019 });
        timelineClock = new CorrelatedClock(wallclock, { correlation: correlation });
        timestamp = new Timestamp(timelineClock, wallclock);
        updated = timeline.update(timestamp);
        expect(onChangeSpy.calls.count()).toEqual(1);
        expect(updated).toEqual(false);
    });

    it ("Does not update clock if not writable, though change might be significant", function () {
        var timeline, correlation, timelineClock, presentationTimestamp, onChangeSpy, updated;

        onChangeSpy = jasmine.createSpy("onChangeSpy");

        // Create non-writable timeline and listen for lock changes
        timeline = new Timeline(timelineId, {
            timelineType: timelineType,
            contentId: contentId,
            clock: clock,
            updateChannel: updateChannel,
            writable: false
        });
        timeline.clock.on("change", onChangeSpy);
        expect(onChangeSpy).not.toHaveBeenCalled();

        // Update the timeline clock (significant change)
        correlation = new Correlation({ parentTime: 0, childTime: 1000 });
        timelineClock = new CorrelatedClock(wallclock, { correlation: correlation });
        timestamp = new Timestamp(timelineClock, wallclock);
        updated = timeline.update(timestamp);
        expect(onChangeSpy.calls.count()).toEqual(0);
        expect(updated).toEqual(false);
    });

});