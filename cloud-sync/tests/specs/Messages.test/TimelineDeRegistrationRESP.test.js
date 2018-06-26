var Message = require("TimelineDeRegistrationRESP");

module.exports = {
    Message: Message,
    name: "TimelineDeRegistrationRESP",
    mandatoryParams: [ "sessionId","responseCode" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineDeRegistrationRESP","version":"0.0.1","responseCode":0,"id":null }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineDeRegistrationREQ","version":"0.0.1","responseCode":0 }'
};
