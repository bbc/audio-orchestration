var Message = require("ContentIdChange");

module.exports = {
    Message: Message,
    name: "ContentIdChange",
    mandatoryParams: [ "sessionId", "deviceId", "contentId" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"ContentIdChange","version":"0.0.1","deviceId":"device1","id":null,"contentId":"urn:some:content"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","deviceId":"device1"}'
};
