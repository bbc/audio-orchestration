var inherits, MessagingAdapter, WeakMap, mqtt, MqttMessagingAdapter, PRIVATE, ChannelMap, MessageFactory;

ChannelMap = require("./ChannelMap");
mqtt = require("mqtt/dist/mqtt.min.js");
WeakMap = require("weak-map");
MessagingAdapter = require("./MessagingAdapter");
inherits = require("inherits");
UnexpectedDeviceExit = require("../../message/impl/UnexpectedDeviceExit");

PRIVATE = new WeakMap();


/**
 * @class MqttMessagingAdapter
 * 
 * @classdesc Messaging adapter for the 
 * [mqtt.js mqtt client]{@link https://www.npmjs.com/package/mqtt}.
 * 
 * @constructor
 * @augments MessagingAdapter
 * 
 * @param {string} host
 * @param {string} port
 * @param {string} user
 * @param {object} [options]
 * @param {string} [options.sessionId]
 * @param {string} [options.contextId]
 * 
 * @fires MessagingAdapter#connectionlost
 * @fires MessagingAdapter#connectionfailure
 * @fires MessagingAdapter#connectionestablished
 * @fires MessagingAdapter#message
 */
MqttMessagingAdapter = function (host, port, user, options) {

    var priv, lastWill, opt,
        sessionId, contextId;

    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);

    opt = options || {};
    
    sessionId = opt.sessionId || "default";
    contextId = opt.contextId || "default";

    priv.host = host;
    priv.port = port;
    priv.user = user;
    priv.subscribedChannels = new ChannelMap();

    lastWill = {};
    lastWill.topic = "Sessions/lastwill";
    lastWill.payload = new UnexpectedDeviceExit(sessionId, contextId, user).serialise();
    lastWill.qos = 2;
    lastWill.retain = false;
    if (typeof port !== "undefined"){
        priv.client = mqtt.connect({ host: host, port: port, keepalive: 60, clientId: user, will: lastWill });
    }else
    {
        var url = "wss://" + host;
        priv.client = mqtt.connect( url,  { keepalive: 60, clientId: user, will: lastWill });
    }

    priv.client.on("connect", this.emit.bind(this, "connectionestablished"));
    priv.client.on("error", this.emit.bind(this, "connectionfailure"));
    priv.client.on("close", this.emit.bind(this, "connectionlost"));
    priv.client.on("message", handleMessage.bind(this));

};

inherits(MqttMessagingAdapter, MessagingAdapter);


function handleMessage (topic, message) {
    this.emit.call(this, "message", message);
}

MqttMessagingAdapter.prototype.getClientId = function () {
    return PRIVATE.get(this).client.options.clientId;
};

MqttMessagingAdapter.prototype.send = function (message, channel, options) {
    var opt;
    if (typeof options!== "undefined")
     {
        opt = {
            qos: options.qos || 0,
            retain: options.retain || false,
            dup: options.dup || false
        };
        PRIVATE.get(this).client.publish(channel, message, opt);
     }
     else
        PRIVATE.get(this).client.publish(channel, message);   

};

MqttMessagingAdapter.prototype.listen = function (channel) {
    var priv = PRIVATE.get(this);
    if (priv.subscribedChannels.addIfNew(channel)) {
        priv.client.subscribe(channel);
    }
};

MqttMessagingAdapter.prototype.stopListen = function (channel) {
    if (priv.subscribedChannels.removeIfContained(channel)) {
        PRIVATE.get(this).client.unsubscribe(channel);
    }
};

MqttMessagingAdapter.prototype.stopListenAll = function () {
    var priv, channels;
    priv = PRIVATE.get(this);
    channels = priv.subscribedChannels.removeAll();
    channels.forEach(function (ch) { priv.client.unsubscribe(ch) });
};

MqttMessagingAdapter.prototype.disconnect = function () {
    PRIVATE.get(this).client.end();
};

module.exports = MqttMessagingAdapter;
