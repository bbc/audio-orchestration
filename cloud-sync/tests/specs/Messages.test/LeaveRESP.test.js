var Message = require("LeaveRESP");

module.exports = {
    Message: Message,
    name: "LeaveRESP",
    mandatoryParams: [ "sessionId", "responseCode" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"LeaveRESP","version":"0.0.1","responseCode":0,"id":null }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"LeaveREQ","version":"0.0.1","responseCode":0 }'
};
