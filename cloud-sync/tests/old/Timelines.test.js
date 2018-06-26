var Timeline = require("Timeline"),
    Timelines = require("Timelines"),
    timelines;

describe("Timelines", function () {

    // ---------------------
    // init
    // ---------------------

    it ("exists", function() {
        expect(Timelines).toBeDefined();
    });

    it ("gets instantiated", function () {
        timelines = new Timelines();
        expect(timelines).toBeDefined();
        expect(timelines.length).toBe(0);
    });


    // ---------------------
    // ADD method
    // ---------------------

    it ("adds a new timeline", function () {
        timelines.add(new Timeline("selector", "urn:timeline:src", { contentId: "contentA" }));
        expect(timelines.length).toBe(1);
    });

    it ("adds a timeline that is similar to a known timeline", function () {
        timelines.add(new Timeline("selector", "urn:timeline:src"));
        expect(timelines.length).toBe(2);
    });

    it ("does not add a timeline that equals a known timeline", function () {
        timelines.add(new Timeline("selector", "urn:timeline:src"));
        expect(timelines.length).toBe(2);
    });

    it ("does not add items of instance other than timeline", function () {
        timelines.add({});
        timelines.add({ timelineSelector: "otherSelector", timelineSrcURN: "urn:timeline:source" });
        expect(timelines.length).toBe(2);
    });


    // ---------------------
    // REMOVE method
    // ---------------------

    it ("removes a known timeline from the list", function () {
        timelines.remove(new Timeline("selector", "urn:timeline:src", { contentId: "contentA" }));
        expect(timelines.length).toBe(1);
    });

    it ("does not remove an unknown timeline from the list", function () {
        timelines.remove(new Timeline("selector", "urn:timeline:src", { contentId: "contentA" }));
        expect(timelines.length).toBe(1);
    });

    it ("does not remove items of instance other than timeline", function () {
        timelines.remove({});
        timelines.remove({ timelineSelector: "selector", timelineSrcURN: "urn:timeline:source" });
        expect(timelines.length).toBe(1);
    });
})
