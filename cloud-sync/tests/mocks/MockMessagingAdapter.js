var MockMessagingAdapter, MessagingAdapter, WeakMap, PRIVATE;

MessagingAdapter = require("messagingadapter/MessagingAdapter");
WeakMap = require("weak-map");
inherits = require("inherits");

PRIVATE = new WeakMap();

MockMessagingAdapter = function (mockResponse, responseDelay) {
    PRIVATE.set(this, {
        mockResponse: mockResponse,
        responseDelay: responseDelay
    });
};

inherits(MockMessagingAdapter, MessagingAdapter);

MockMessagingAdapter.prototype.send = function (message, channel) {
    var priv = PRIVATE.get(this);
    setTimeout(this.emit.bind(this, "message", priv.mockResponse.serialise()), priv.responseDelay);
};

module.exports = MockMessagingAdapter;