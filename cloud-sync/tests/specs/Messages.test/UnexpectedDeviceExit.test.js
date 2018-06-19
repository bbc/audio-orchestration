var Message = require("UnexpectedDeviceExit");

module.exports = {
    Message: Message,
    name: "UnexpectedDeviceExit",
    mandatoryParams: [ "sessionId", "contextId", "deviceId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"UnexpectedDeviceExit","version":"0.0.1","deviceId":"device1","id":null,"contextId":"ctx1"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"LeaveRESP","version":"0.0.1","deviceId":"device1"}'
};
