var Message = require("TimelineEndSubscriptionRESP");

module.exports = {
    Message: Message,
    name: "TimelineEndSubscriptionRESP",
    mandatoryParams: [ "sessionId", "responseCode" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineEndSubscriptionRESP","version":"0.0.1","responseCode":0,"id":null }',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineEndSubscriptionREQ","version":"0.0.1","responseCode":0 }'
};
