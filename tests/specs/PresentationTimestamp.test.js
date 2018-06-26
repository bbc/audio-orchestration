var PresentationTimestamp = require("PresentationTimestamp");
var Clocks = require("dvbcss-clocks");

var wallclock
var mediaClock;
var earliestOffset = -5000;
var latestOffest = 8000;
var pts = null;

describe ("PresentationTimestamp", function () {

    beforeEach(function () {
        // Prevent system clock from ticking during runtime of the test
        jasmine.clock().install();
        wallclock = new Clocks.DateNowClock();
        mediaClock = new Clocks.CorrelatedClock(wallclock);
        pts = new PresentationTimestamp(mediaClock, wallclock, earliestOffset, latestOffest);
    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it ("Exists", function () {
        expect(PresentationTimestamp).toBeDefined();
    });

    it ("Creates instance from media clock and wallclock with expect values", function () {
        expect(pts).toEqual(jasmine.any(PresentationTimestamp));
        expect(pts.earliest.contentTime-pts.actual.contentTime).toEqual(earliestOffset);
        expect(pts.actual.contentTime-pts.actual.contentTime).toEqual(0);
        expect(pts.latest.contentTime-pts.actual.contentTime).toEqual(latestOffest);
    });

    it ("Creates instance from PresentationTimestamp-like object", function () {
        var ptsLike = JSON.parse((JSON.stringify(pts)));
        var newPts = new PresentationTimestamp(ptsLike);
        expect(newPts).toEqual(pts);
    });

});