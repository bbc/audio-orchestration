var Message = require("TimelineQuery");

module.exports = {
    Message: Message,
    name: "TimelineQuery",
    mandatoryParams: [ "sessionId" ],
    optionalParams: [ "id", "version", "contentId", "timelineType" ],
    invalidParamValues: [ 0 ],
    validJsonMsg: '{"sessionId":"session1","type":"TimelineQuery","version":"0.0.1","id":null,"contentId":"*","timelineType":"*"}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"JoinRESP","version":"0.0.1","deviceId":"device1"}'
};
