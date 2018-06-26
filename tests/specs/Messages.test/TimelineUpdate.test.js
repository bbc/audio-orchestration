var Message = require("TimelineUpdate"),
    mockTimestamp = JSON.stringify({
        earliest: { contentTime: 0, wallclockTime: 0, speed: 1 },
        actual: { contentTime: 1, wallclockTime: 1, speed: 1 },
        latest: { contentTime: 2, wallclockTime: 2, speed: 1 },
    }),
    mockDispersionAt = JSON.stringify({
        dispersionS: .05,
        timeS: 10
    });

module.exports = {
    Message: Message,
    name: "TimelineUpdate",
    mandatoryParams: [ "sessionId", "deviceId", "timelineId", "timelineType", "contentId", "presentationTimestamp", "dispersionAt" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineUpdate","version":"0.0.1","deviceId":"device1","presentationTimestamp":' + mockTimestamp + ',"dispersionAt":' + mockDispersionAt + ',"id":null,"timelineId":"urn:unique:timeline","timelineType":"urn:unique:timeline:type","contentId":"unique:content:id"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineUpdateRESP","version":"0.0.1","deviceId":"device1","presentationTimestamp":' + mockTimestamp + '}'
};
