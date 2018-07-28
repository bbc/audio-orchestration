var inherits, MessagingAdapter, WeakMap, PahoMQTT,
    PahoMqttMessagingAdapter, PRIVATE;

PahoMQTT = require("paho-mqtt");
WeakMap = require("weak-map");
MessagingAdapter = require("./MessagingAdapter");
inherits = require("inherits");
PRIVATE = new WeakMap();


/**
 * @class PahoMqttMessagingAdapter
 * 
 * @classdesc Messaging adapter for the 
 * [Paho MQTT client]{@link https://www.npmjs.com/package/paho-mqtt}.
 * 
 * @constructor
 * @augments MessagingAdapter
 * 
 * @param {string} host
 * @param {string} port
 * @param {string} user
 * 
 * @fires MessagingAdapter#connectionlost
 * @fires MessagingAdapter#connectionfailure
 * @fires MessagingAdapter#connectionestablished
 * @fires MessagingAdapter#message
 */
PahoMqttMessagingAdapter = function (host, port, user) {
    
    var priv;
    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);

    priv.host = host;
    priv.port = port;
    priv.user = user;

    priv.client = new Paho.MQTT.Client(host, port, user);
    priv.client.onConnectionLost = this.emit.bind(this, "connectionlost");
    priv.client.onMessageArrived = handleMessage.bind(this);
    priv.client.connect({
        onSuccess: this.emit.bind(this, "connectionestablished"),
        onFailure: this.emit.bind(this, "connectionfailure"),
        useSSL: true
    });
};

inherits(PahoMqttMessagingAdapter, MessagingAdapter);


function handleMessage (message) {
    this.emit.call(this, "message", message.payloadString);
}

MqttMessagingAdapter.prototype.getClientId = function () {
    return PRIVATE.get(this).user;
};

PahoMqttMessagingAdapter.prototype.send = function (message, channel) {
    var msg = new Paho.MQTT.Message(message);
    msg.destinationName = channel;
    PRIVATE.get(this).client.send(msg);
};

PahoMqttMessagingAdapter.prototype.listen = function (channel) {
    PRIVATE.get(this).client.subscribe(channel);
};


PahoMqttMessagingAdapter.prototype.stopListen = function (channel) {
    PRIVATE.get(this).client.unsubscribe(channel);
};

module.exports = PahoMqttMessagingAdapter;
