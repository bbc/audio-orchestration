var Message = require("DeviceStatus");

module.exports = {
    Message: Message,
    name: "DeviceStatus",
    mandatoryParams: [ "sessionId", "deviceId", "status" ],
    optionalParams: [ "id", "version", "contextId" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"DeviceStatus","version":"0.0.1","deviceId":"device1","id":null,"status":"online","contextId":null}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","deviceId":"device1"}'
};
