var Synchroniser = require("Synchroniser"),
    synchroniser = null;

describe("Synchroniser", function () {

    it ("exists", function () {
        expect(Synchroniser).toBeDefined();
    });

    it ("gets instantiated", function () {
        synchroniser = new Synchroniser("123", "ws://192.128.1.2:3456", "urn:some:node");
        expect(synchroniser).toBeDefined();
    });

    it ("executes call 'initWithTimelineSource'", function () {
        var result = synchroniser.initWithTimelineSource("sometimeline", "urn:timeline:source", "contentA");
        expect(result).toBe(true);
    });

    it ("executes call 'addTimelineSource'", function () {
        var result = synchroniser.addTimelineSource("sometimeline", "urn:timeline:source", "contentB");
        expect(result).toBe(true);
    });

    it ("executes call 'removeTimelineSource'", function () {
        var result = synchroniser.addTimelineSource("sometimeline", "urn:timeline:source", "contentA");
        expect(result).toBe(true);
    });

});
