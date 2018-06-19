var Message = require("DeviceRESP");

module.exports = {
    Message: Message,
    name: "DeviceRESP",
    mandatoryParams: [ "sessionId","responseCode" ,"devices" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"DeviceRESP","version":"0.0.1","responseCode":0,"devices":["device2","device3","device4"],"id":null}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"DeviceREQ","version":"0.0.1","responseCode":0,"devices":["device2","device3","device4"]}',
};
