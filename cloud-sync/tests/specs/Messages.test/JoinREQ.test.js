var Message = require("JoinREQ");

module.exports = {
    Message: Message,
    name: "JoinREQ",
    mandatoryParams: [ "sessionId", "contextId", "deviceId", "responseChannel", "requestChannel", "syncTLStrategy" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"JoinREQ","version":"0.0.1","deviceId":"device1","id":null,"responseChannel":"services/123/RESP","requestChannel":"services/123/REQ","contextId":"ctx1","syncTLStrategy":1}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","deviceId":"device1"}'
};
