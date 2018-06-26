var Message = require("PingRESP");

module.exports = {
    Message: Message,
    name: "PingRESP",
    mandatoryParams: [ "sessionId", "responseCode" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"PingRESP","version":"0.0.1","responseCode":0,"id":null }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"LeaveREQ","version":"0.0.1","responseCode":0 }'
};
