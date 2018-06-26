var Message = require("JoinRESP");

module.exports = {
    Message: Message,
    name: "JoinRESP",
    mandatoryParams: [ "sessionId", "responseCode", "wallclockUrl", "sessionSyncControllerUrl" ],
    optionalParams: [ "id", "version", "rateLimit" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","responseCode":0,"wallclockUrl":"ws://localhost:9999/wc","sessionSyncControllerUrl":"ws://localhost:9999/ssc","id":null,"rateLimit":{"numUpdates":10,"interval":5}}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinREQ","version":"0.0.1","responseCode":0,"wallclockUrl":"ws://localhost:9999/wc","sessionSyncControllerUrl":"ws://localhost:9999/ssc"}'
};
