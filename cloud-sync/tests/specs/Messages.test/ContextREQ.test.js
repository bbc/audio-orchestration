var Message = require("ContextREQ");

module.exports = {
    Message: Message,
    name: "ContextREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"ContextREQ","version":"0.0.1","deviceId":"device1","id":null,"responseChannel":"services/123/RESP","contextId":"ctx1"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","deviceId":"device1"}'
};
