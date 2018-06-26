var SyncREQMessage = require("SyncREQMessage");//.Protocol.SyncREQMessage;
var Timeline = require("Timeline");//.Protocol.Timeline;
var clocks            = require("dvbcss-clocks");
var Correlation       = clocks.Correlation;

describe("SyncREQMessage", function() {
    it("exists", function() {
      expect(SyncREQMessage).toBeDefined();
    });
});



describe("MESSAGE_TYPES", function() {
    it("exists", function() {
      expect(MESSAGE_TYPES).toBeDefined();
    });
});

describe("Timeline", function() {

  var pts_timeline;
  var options;
  var timeline_sel = "urn:timeline:pts";
  var timelineSrcURN = "urn:device123:videoplayer3";

  beforeEach(function() {
      options = {
          parent : new Timeline("urn:timeline:WallClock", "urn:server:DateNowClock"),
          correlation: new Correlation(10, 20, 0.5, 0.1),
          tickRate: 90000,
          speed: 1,
          contentId: "http://origin.cdn.com/avideo.mp4"
      };
      pts_timeline = new Timeline(timeline_sel, timelineSrcURN, options);
  });

  it("exists", function() {
    expect(Timeline).toBeDefined();
  });

  it("gets instantiated", function() {
    console.log(pts_timeline.timelineSelector);
    expect(pts_timeline).not.toBeUndefined();
    expect(pts_timeline.timelineSelector).toBe(timeline_sel);
    expect(pts_timeline.timelineSrcURN).toBe(timelineSrcURN);

    expect(pts_timeline.parent.timelineSelector).toBe("urn:timeline:WallClock");
    expect(pts_timeline.parent.timelineSrcURN).toBe("urn:server:DateNowClock");
    expect(pts_timeline.tickRate).toBe(90000);
    expect(pts_timeline.speed).toBe(1);
    expect(pts_timeline.contentId).toBe("http://origin.cdn.com/avideo.mp4");
  });
});

describe("SyncREQMessage", function() {


    it("exists", function() {
      expect(SyncREQMessage).toBeDefined();
    });

    it ("checks if SyncREQMessage serialised and deserialised.", function() {

      var pts_options = {
          parent : new Timeline("urn:timeline:WallClock", "urn:server:DateNowClock"),
          correlation: new Correlation(10, 20, 0.5, 0.1),
          tickRate: 90000,
          speed: 1,
          contentId: "dvb://somecontentid"
      };
      var pts_timeline_before = new Timeline("urn:timeline:pts", "urn:ctx1:device123:broadcast", pts_options);

      var SET_options = {
          parent : new Timeline("urn:timeline:WallClock", "urn:server:DateNowClock"),
          correlation: new Correlation(10, 20, 0 , 0),
          tickRate: 1000,
          speed: 1,
          contentId: "http://origin.cdn.com/avideo.mp4"
      };
      var SET_timeline_before = new Timeline("urn:bbc:set", "urn:ctx1:device123:videoplayer1", SET_options);


      var req_before = new SyncREQMessage("1.0",
                                            "123",
                                            "urn:ctx1:device123",
                                            [pts_timeline_before, SET_timeline_before]
                                            );
      console.log("BEFORE: " + req_before.serialise());
      var req_after  = SyncREQMessage.deserialise(req_before.serialise());
      console.log("AFTER: " + req_after.serialise());

      expect(req_before).toBeDefined();
      expect(req_after).toBeDefined();

      expect(req_before.version).toBe(req_after.version);
      expect(req_before.sessionId).toBe(req_after.sessionId);
      expect(req_before.nodeURN).toBe(req_after.nodeURN);
      expect(req_before.type).toBe(req_after.type);

       expect(req_after.timelines).toContain(req_before.timelines[0]);
       expect(req_after.timelines).toContain(req_before.timelines[1]);

      expect(req_before.timelines[0].timelineSelector).toBe(req_after.timelines[0].timelineSelector);
    });
});
