import EventEmitter from 'events';

/**
 * @typedef {object} Sync#presence
 * @property {string} deviceId
 * @property {string} status - 'joined' or 'left'
 */

/**
 * @typedef {null} Sync#connected
 */

/**
 * @typedef {null} Sync#disconnected
 */

/**
 * @typedef {object} Sync#broadcast
 * @property {string} topic
 * @property {string} deviceId
 * @property {object} content
 */


/**
 * This class defines a common interface -- events and methods -- for the different sync
 * and communication back-ends.
 *
 * @emits Sync#presence when any device joins or leaves the session
 * @emits Sync#connected once successfully connected to the wall clock service
 * @emits Sync#disconnected after failing to connect
 * @emits Sync#message when any session-wide custom broadcast message is received
 */
class Sync extends EventEmitter {
  /**
   * @param {SyncAdapter} adapter
   */
  constructor(adapter) {
    super();

    /**
     * @private
     * @type {SyncAdapter}
     */
    this.adapter = adapter;

    this.adapter.on('presence', this.onPresence.bind(this));
    this.adapter.on('connected', this.onConnected.bind(this));
    this.adapter.on('disconnected', this.onDisconnected.bind(this));
    this.adapter.on('broadcast', this.onBroadcast.bind(this));
  }

  /**
   * Initialises the adapter connection, and registers this device to join the given session.
   *
   * @param {string | object} endpoint - depending on the chosen adapter, the URL or
   * { hostname, port } to connect to.
   * @param {string} sessionId - the session to join
   * @param {string} deviceId - the device-id to register as
   *
   * @returns {Promise}
   */
  connect(endpoint, sessionId, deviceId) {
    if (typeof endpoint !== 'string' && typeof endpoint !== 'object') {
      throw new Error('endpoint must be set and must be a string or object.');
    }

    if (typeof sessionId !== 'string') {
      throw new Error('sessionId must be set and must be a string.');
    }

    if (typeof deviceId !== 'string') {
      throw new Error('deviceId must be set and must be a string.');
    }

    return this.adapter.connect(endpoint, { sessionId, deviceId });
  }

  /**
   * Sends a broadcast message to all devices in the session.
   *
   * @param {string} topic
   * @param {object} message
   *
   * @returns {Promise} resolving when the message has been successfully sent.
   */
  sendMessage(topic, message) {
    return this.adapter.sendMessage(topic, message);
  }

  /**
   * Waits for a sync timeline of given type and contentId to be registered in the session and
   * provides a CorrelatedClock for it when it becomes available.
   *
   * * Use this method for a 'slave' client to be controlled by a remote timeline.
   * * Use {@link provideTimelineClock} for a 'master' client also providing updates to the server.
   *
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @return {Promise<CorrelatedClock>} resolving when the clock is available.
   * @public
   */
  requestTimelineClock(timelineType, contentId) {
    return this.adapter.requestTimelineClock(timelineType, contentId);
  }

  /**
   * Registers a correlated clock to provide timeline updates to the
   * service, and receive updates from it.
   *
   * The provided clock may be changed by the Sync service.
   *
   * * Use this method for a 'master' client controlling the experience. Multiple masters will
   *   elect a leader for updating the session-wide timeline.
   * * Use {@link synchroniseToTimeline} for a 'slave' client to wait until
   *   another device provides a timeline to synchronise to.
   *
   * @param {CorrelatedClock} timelineClock
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @returns {Promise}
   * @public
   */
  provideTimelineClock(timelineClock, timelineType, contentId) {
    return this.adapter.provideTimelineClock(timelineClock, timelineType, contentId);
  }

  /**
   * Get the underlying wall clock instance.
   * @returns {CorrelatedClock} wallClock
   */
  get wallClock() {
    return this.adapter.wallClock;
  }

  /**
   * @private
   */
  onPresence(e) {
    this.emit('presence', {
      deviceId: e.deviceId,
      status: e.status,
    });
  }

  /**
   * @private
   */
  onConnected() {
    this.emit('connected');
  }

  /**
   * @private
   */
  onDisconnected(e) {
    this.emit('disconnected', e);
  }

  /**
   * @private
   */
  onBroadcast(e) {
    this.emit('broadcast', e);
  }
}

export default Sync;
