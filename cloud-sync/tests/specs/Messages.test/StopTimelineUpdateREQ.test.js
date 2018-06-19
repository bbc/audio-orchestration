var Message = require("StopTimelineUpdateREQ");

module.exports = {
    Message: Message,
    name: "StopTimelineUpdateREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "timelineId", "timelineType", "contentId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"StopTimelineUpdateREQ","version":"0.0.1","deviceId":"device1","id":null,"responseChannel":"services/123/RESP","contextId":"ctx1","timelineId":"urn:unique:timeline:id","timelineType":"urn:unique:timeline:type","contentId":"urn:unique:content:id"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"StopTimelineUpdateRESP","version":"0.0.1","deviceId":"device1"}'
};
