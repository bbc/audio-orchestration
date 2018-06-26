var Message = require("TimelineDeRegistrationREQ");

module.exports = {
    Message: Message,
    name: "TimelineDeRegistrationREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "timelineId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineDeRegistrationREQ","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline","id":null,"responseChannel":"services/123/RESP","contextId":"ctx1"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineDeRegistrationRESP","version":"0.0.1","deviceId":"device1","timelineId":"urn:a:unique:timeline" }'
};
