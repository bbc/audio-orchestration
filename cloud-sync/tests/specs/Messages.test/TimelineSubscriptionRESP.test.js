var Message = require("TimelineSubscriptionRESP");

module.exports = {
    Message: Message,
    name: "TimelineSubscriptionRESP",
    mandatoryParams: [ "sessionId", "responseCode", "providerChannel" ],
    optionalParams: [ "id", "version", "presentationTimestamp" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineSubscriptionRESP","version":"0.0.1","responseCode":0,"presentationTimestamp":null,"providerChannel":"/session/123/456","id":null}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineSubscriptionREQ","version":"0.0.1","responseCode":0,"presentationTimestamp":null}'
};
