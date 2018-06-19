import EventEmitter from 'events';
import cloudSyncKit from 'synckit-cloud';
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

class CloudSyncAdapter extends EventEmitter {
  constructor({ sysClock = null } = {}) {
    super();
    this._sysClock = sysClock;
    if (this._sysClock === null) {
      this._sysClock = new clocks.DateNowClock();
    }
    this._connected = false;
    this._connectPromise = null;
    this._synchroniser = null;

    /**
     * Create a wall clock (units milliseconds)
     * @type {CorrelatedClock}
     */
    this._wallClock = new clocks.CorrelatedClock(this._sysClock, { tickRate: 1000 });
    console.log('wall clock after creation:', this._wallClock.getCorrelation().parentTime, this._wallClock);
  }

  /**
   * Connects to the synchronisation service.
   *
   * @returns {Promise<CloudSyncSyncAdapter>} a promise resolving when successfully connected.
   */
  connect(syncUrl, {
    sessionId,
    deviceId,
  }) {
    if (this._connectPromise !== null) {
      return this._connectPromise;
    }
    this._syncUrl = syncUrl;

    this._connectPromise = new Promise((resolve, reject) => {
      console.log(sessionId, deviceId);
      this._synchroniser = cloudSyncKit.getCloudSynchroniser(
        { hostname: syncUrl },
        sessionId,
        'default',
        deviceId,
        {
          syncTimelineElection: cloudSyncKit.SyncTLElection.EARLIEST_FIRST,
          sysClock: this._sysClock,
        },
      );

      this._synchroniser.on('WallClockAvailable', () => {
        this._wallClock.setParent(this._synchroniser.wallclock);
        console.log('wall clock after connection:', this._wallClock.getCorrelation().parentTime, this._wallClock.getCorrelation().childTime, this._wallClock);
        this.emit('connected');
        resolve(this);
      });

      this._synchroniser.on('SyncServiceUnavailable', () => {
        this.emit('disconnected');
        reject();
      });
    });
    return this._connectPromise;
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
   * Registers a correlated clock to receive and provide timeline updates.
   *
   * @public
   *
   * @returns {Promise}
   */
  synchronise(timelineClock, timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('synchroniser not available. call connect() before synchronise().');
    }
    return this._connectPromise.then(() => {
      console.debug('cloud sync adapter synchronise connected');
      this._synchroniser.synchronise(timelineClock, timelineType, contentId);
      return true;
    });
  }
}

export default CloudSyncAdapter;
