var Message = require("ContextRESP");

module.exports = {
    Message: Message,
    name: "ContextRESP",
    mandatoryParams: [ "sessionId","responseCode","contexts" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"ContextRESP","version":"0.0.1","responseCode":0,"contexts":["urn:some:context:1","urn:some:context:2","urn:some:context:3"],"id":null}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"DeviceREQ","version":"0.0.1","responseCode":0,"contexts":["urn:some:context:1","urn:some:context:2","urn:some:context:3"]}',
};
