var Message = require("TimelineUpdateRESP");

module.exports = {
    Message: Message,
    name: "TimelineUpdateRESP",
    mandatoryParams: [ "sessionId", "responseCode" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineUpdateRESP","version":"0.0.1","responseCode":0,"id":null }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineUpdateREQ","version":"0.0.1","responseCode":0 }'
};