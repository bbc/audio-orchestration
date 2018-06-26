var Message = require("SyncTimelinesRESP");

var mockInfos = JSON.stringify([
    {
        timelineId: "urn:unique:timeline:id:1",
        timelineType: "urn:unique:timeline:type:1",
        contentId: "urn:unique:content:id:1",
        providerId: "urn:unique:provider:id:1",
        providerType: "urn:unique:provider:type:1",
        providerChannel: "urn/unique/provider/channel/1",
        syncTimeline: true
    },
    {
        timelineId: "urn:unique:timeline:id:2",
        timelineType: "urn:unique:timeline:type:2",
        contentId: "urn:unique:content:id:2",
        providerId: "urn:unique:provider:id:2",
        providerType: "urn:unique:provider:type:2",
        providerChannel: "urn/unique/provider/channel/2",
        syncTimeline: true
    },
    {
        timelineId: "urn:unique:timeline:id:3",
        timelineType: "urn:unique:timeline:type:3",
        contentId: "urn:unique:content:id:3",
        providerId: "urn:unique:provider:id:3",
        providerType: "urn:unique:provider:type:3",
        providerChannel: "urn/unique/provider/channel/3",
        syncTimeline: false
    }
]);

module.exports = {
    Message: Message,
    name: "SyncTimelinesRESP",
    mandatoryParams: [ "sessionId", "responseCode", "timelineInfo" ],
    optionalParams: [ "id", "version" ],
    invalidParamValues: [ "0" ],
    validJsonMsg: '{"sessionId":"session1","type":"SyncTimelinesRESP","version":"0.0.1","responseCode":0,"timelineInfo":' + mockInfos + ',"id":null}',
    jsonWrongParams: '{"sessionId":"session1"}',
    jsonWrongType: '{"sessionId":"session1","type":"TimelineREQ","version":"0.0.1","responseCode":0,"timelineInfo":' + mockInfos + '}'
};
