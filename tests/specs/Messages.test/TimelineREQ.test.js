var Message = require("TimelineREQ");

module.exports = {
    Message: Message,
    name: "TimelineREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel" ],
    optionalParams: [ "id", "version", "providerContextId", "providerId", "timelineType", "contentId", "syncTimeline" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineREQ","version":"0.0.1","deviceId":"device1","id":null,"timelineType":null,"contentId":null,"providerContextId":null,"providerId":null,"responseChannel":"services/123/RESP","contextId":"ctx1", "syncTimeline":false}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineRESP","version":"0.0.1","deviceId":"device1"}'
};