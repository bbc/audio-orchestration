var TimelineId = require("TimelineId");

describe("TimelineId", function () {

    it("Exists", function () {
        expect(TimelineId).toBeDefined();
    });

    it("Creates instance", function () {
        var timelineId = new TimelineId("ctx1", "dvc1", "src1");
        expect(timelineId instanceof TimelineId).toBe(true);
    });

    it("Instance has expected properties", function () {
        var timelineId = new TimelineId("ctx1", "dvc1", "src1");
        expect(timelineId.contextId).toEqual("ctx1");
        expect(timelineId.deviceId).toEqual("dvc1");
        expect(timelineId.sourceId).toEqual("src1");
    });

    it("Converts instance into URN string", function () {
        var timelineId, urnString;
        timelineId = new TimelineId("ctx1", "dvc1", "src1");
        urnString = timelineId.toUrnString();
        expect(urnString).toEqual("urn:ctx1:dvc1:c3JjMQ==");
    });

    it("Creates instance from URN string", function () {
        var timelineId = TimelineId.fromUrnString("urn:ctx1:dvc1:c3JjMQ==");
        expect(timelineId instanceof TimelineId).toBe(true);
        expect(timelineId.contextId).toEqual("ctx1");
        expect(timelineId.deviceId).toEqual("dvc1");
        expect(timelineId.sourceId).toEqual("src1");
    });

});