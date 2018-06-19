var Message = require("TimelineUpdateREQ");

module.exports = {
    Message: Message,
    name: "TimelineUpdateREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "timelineId", "timelineType", "contentId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineUpdateREQ","version":"0.0.1","deviceId":"device1","id":null,"responseChannel":"services/123/RESP","contextId":"ctx1","timelineId":"urn:unique:timeline:id","timelineType":"urn:unique:timeline:type","contentId":"urn:unique:content:id"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineUpdateRESP","version":"0.0.1","deviceId":"device1"}'
};
