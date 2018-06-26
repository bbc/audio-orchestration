var MessageFactory = require("MessageFactory");
var events = require("events");
var inherits = require("inherits");

var wallClockUrl = "ws://wallclock.example.com";
var sessionSyncController = "ws://sessioncontroller.example.com"

var MessagingAdapter = function () {
    setTimeout(this.emit.bind(this, "connectionestablished"), 250);
};

inherits(MessagingAdapter, events);


MessagingAdapter.prototype.send = function (message) {
    handleMessage.call(this, message);
};

MessagingAdapter.prototype.sendRequest = function () {
    handleMessage.call(this, message);
};

function handleMessage (message) {
    switch (message.type) {
        case "JoinREQ": handleJoinREQ.call(this, message);
            break;
        default:
            break;
    }
}

function handleJoinREQ (m) {
    var response = MessageFactory.create("JoinRESP", m.sessionId, m.responseCode, wallClockUrl, sessionSyncController, m.id, m.version);
    setTimeout(this.emit.bind(this, "message", response.serialise()), 250);
}

module.exports = MessagingAdapter;