import EventEmitter from 'events';
import dvbcss from 'dvbcss-protocols';
import clocks from 'dvbcss-clocks';

/**
 * The DvbcssSyncAdapter wraps the dvbcss synchronisation clients in an API
 * compatible with the {@link CloudSyncAdapter} so they can be swapped out.
 *
 * @example
 * import clocks from 'dvbcss-clocks';
 *
 * const sync = new DvbcssSyncAdapter({ sysClock: new clocks.DateNowClock() });
 * const timelineClock = new clocks.CorrelatedClock(sync.wallClock);
 *
 * sync.connect(baseUrl).then(() => {
 *   console.log('connected');
 * });
 *
 * sync.synchronise(timelineClock, timelineType, contentId).catch((error) => {
 *   console.error('could not synchronise', error);
 * };
 *
 * // Now, the timelineClock is synchronised with the server's timeline and
 * // changes to the correlation on the server will update this instance.
 *
 */

class DvbcssSyncAdapter extends EventEmitter {
  constructor({ sysClock = null } = {}) {
    super();
    this._sysClock = sysClock;
    if (this._sysClock === null) {
      this._sysClock = new clocks.DateNowClock();
    }
    this._connected = false;
    this._wcPromise = null;

    /**
     * Create a wall clock (units milliseconds)
     * @type {CorrelatedClock}
     */
    this._wallClock = new clocks.CorrelatedClock(this._sysClock, { tickRate: 1000 });
  }

  /**
   * Connects to the synchronisation service.
   *
   * @returns {Promise<DvbcssSyncAdapter>} a promise resolving when successfully connected.
   */
  connect(baseUrl) {
    this._baseUrl = baseUrl;
    return this.connectWallClock().then(() => this);
  }

  /**
   * Connects the {@link wallClock} to the WallClock synchronisation service.
   *
   * @emits connected
   * @emits disconnected
   * @returns {Promise<DvbcssSyncAdapter>} a promise resolving when successfully connected.
   * @private
   */
  connectWallClock() {
    // If we are already waiting to connect, return the pending promise.
    if (this._wcPromise !== null) {
      return this._wcPromise;
    }

    // check we have a base url
    if (this._baseUrl === undefined) {
      throw new Error('baseUrl must be set.');
    }

    // create a socket connection
    const wcSocket = new WebSocket(`${this._baseUrl}/wc`);
    wcSocket.binaryType = 'arraybuffer';

    // create the protocol client
    this._wallClockClient = dvbcss.WallClock.createBinaryWebSocketClient(
      wcSocket,
      this._wallClock,
      {},
    );

    // Wrap the successful opening of the socket in a promise.
    this._wcPromise = new Promise((resolve, reject) => {
      wcSocket.addEventListener('close', (e) => {
        this._connected = false;
        reject(e);
        this.emit('disconnected');
      });
      wcSocket.addEventListener('open', () => {
        this._connected = true;
        this.emit('connected');
        resolve(true);
      });
    }).then(() => this);

    return this._wcPromise;
  }

  /**
   * Provides the underlying synchronised wall clock object.
   *
   * @returns {CorrelatedClock} wallClock
   * @public
   */
  get wallClock() {
    return this._wallClock;
  }

  /**
   * Registers a correlated clock to receive timeline updates.
   *
   * @todo: Although not part of dvbcss, a client may also need
   * to submit timeline updates for parity with cloud-sync.
   *
   * @public
   *
   * @returns {Promise}
   */
  synchronise(timelineClock, timelineType, contentId) {
    // check we have a base url
    if (this._baseUrl === undefined) {
      throw new Error('baseUrl must be set, call connect() before synchronise().');
    }

    const tsSocket = new WebSocket(`${this._baseUrl}/ts`);
    dvbcss.TimelineSynchronisation.createTSClient(
      tsSocket,
      timelineClock,
      {
        contentIdStem: contentId,
        timelineSelector: timelineType,
        tickrate: 1,
      },
    );

    return new Promise((resolve, reject) => {
      tsSocket.addEventListener('close', (e) => {
        reject(e);
      });
      tsSocket.addEventListener('open', () => {
        resolve();
      });
    });
  }
}

export default DvbcssSyncAdapter;
