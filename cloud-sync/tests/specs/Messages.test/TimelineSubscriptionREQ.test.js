var Message = require("TimelineSubscriptionREQ");

module.exports = {
    Message: Message,
    name: "TimelineSubscriptionREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "timelineId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineSubscriptionREQ","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline","id":null,"responseChannel":"services/123/RESP","contextId":"ctx1"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineSubscriptionRESP","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline" }'
};
