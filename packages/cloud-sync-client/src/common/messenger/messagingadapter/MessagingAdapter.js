var events, inherits;

events = require("events");
inherits = require("inherits");

/**
 * @class MessagingAdapter
 * 
 * Abstract base class for messaging adapters. Implementations available:
 * <ul>
 *  <li>{@link MqttMessagingAdapter}</li>
 * </ul>
 * 
 * @constructor
 * @abstract
 * 
 * @param {string} host
 * @param {string} port
 * @param {string} user
 * 
 * @fires MessagingAdapter#connectionlost
 * @fires MessagingAdapter#connectionfailure
 * @fires MessagingAdapter#connectionestablished
 * @fires MessagingAdapter#message
 * 
 */
var MessagingAdapter = function (host, port, user) { throw new Error ("Can not create instance of abstract class MessagingAdapter") };

inherits(MessagingAdapter, events);


/**
 * The connection to the messaging server was closed.
 * @event MessagingAdapter#connectionlost
 */

/**
 * A failure occured during setup of the  connection to the messaging
 * server.
 * @event MessagingAdapter#connectionfailure
 */

/**
 * The connection to the messaging server has been established.
 * @event MessagingAdapter#connectionestablished
 */

/**
 * A message has been received via one of the subscribed channels.
 * @event MessagingAdapter#message
 * @property {string} message
 */

 /**
  * Get this messaging client's clientId
  */
MessagingAdapter.prototype.getClientId = function () { throw "Not implemented" };
 
/**
 * Send a message to a given channel. Best effort. No ACK.
 * @param {string} message
 * @param {string} channel a device's id or  network address e.g. ip_address:port_number 
 * @param {object} options send options such as delivery guarantees, retain
 * @param {number} options.qos 0 - at most once, 1 - at least once, 2 - exactly once
 * @param {boolean} options.retain retain message copy in channel for clients joining after the send.
 *  
 */
MessagingAdapter.prototype.send = function (message, channel, options) { throw "Not implemented" };

/**
 * Start listening for messages from a given channel.
 * @param {string} channel 
 */
MessagingAdapter.prototype.listen = function (channel) { throw "Not implemented" };

/**
 * Stop  listening for messages to a given channel.
 * @param {string} channel
 */
MessagingAdapter.prototype.stopListen = function (channel) { throw "Not implemented" };

/**
 * Stop listening all subscribed channels.
 */
MessagingAdapter.prototype.stopListenAll = function (channel) { throw "Not implemented" };

/**
 * Terminate connection
 */
MessagingAdapter.prototype.disconnect = function (channel) { throw "Not implemented" };

module.exports = MessagingAdapter;