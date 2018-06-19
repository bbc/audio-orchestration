var Message = require("TimelineRegistrationRESP");

module.exports = {
    Message: Message,
    name: "TimelineRegistrationRESP",
    mandatoryParams: [ "sessionId", "responseCode", "timelineUpdateChannel" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineRegistrationRESP","version":"0.0.1","responseCode":0,"id":null,"timelineUpdateChannel":"session/132/context/344/device/876/timeline/567" }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineRegistrationREQ","version":"0.0.1","responseCode":0 }'
};
