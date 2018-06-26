var Message = require("TimelineRegistrationREQ"),
    mockCorr = JSON.stringify({
        parentTime: 0,
        childTime: 0,
        initialError: 0.1,
        errorGrowthRate: 0.0001 
    });

module.exports = {
    Message: Message,
    name: "TimelineRegistrationREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "correlation", "timelineId", "contentId", "timelineType", "frequency", "channel", "useForSessionSync", "writable" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineRegistrationREQ","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline","contentId":"content1","timelineType":"a:timeline:descriptor","id":null,"correlation":' + mockCorr + ',"responseChannel":"services/123/RESP","contextId":"ctx1","channel":"some/channel","frequency":1000,"useForSessionSync":false,"writable":true}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineRegistrationRESP","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline","contentId":"content1","timelineType":"a:timeline:descriptor"}'
};