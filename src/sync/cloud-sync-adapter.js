import cloudSyncKit from 'synckit-cloud';
import clocks from 'dvbcss-clocks';
import SyncAdapter from './sync-adapter';

/**
 * The CloudSyncAdapter wraps the cloud-sync synchronisation clients in an API
 * compatible with the {@link DvbcssSyncAdapter} so they can be swapped out.
 *
 * @example
 * import clocks from 'dvbcss-clocks';
 *
 * const sync = new CloudSyncAdapter({ sysClock: new clocks.DateNowClock() });
 * const timelineClock = new clocks.CorrelatedClock(sync.wallClock);
 *
 * sync.connect(syncUrl, { deviceId: 'd1', sessionId: 's1' }).then(() => {
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

class CloudSyncAdapter extends SyncAdapter {
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
    this._wallClock = new clocks.CorrelatedClock(this._sysClock, {
      tickRate: 1000,
    });
    this._wallClock.id = 'adapter-wallClock';
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
        this.emit('connected');
        resolve(this);
      });

      this._synchroniser.on('SyncServiceUnavailable', () => {
        this.emit('disconnected', 'CloudSyncAdapter: connect failed.');
        reject();
      });

      this._synchroniser.on('ApplicationBroadcast', (e) => {
        const { deviceId, topic, content } = e;
        this.emit('broadcast', {
          deviceId,
          topic,
          content,
        });
      });

      this._synchroniser.on('DeviceStatus', (e) => {
        const { deviceId, status } = e;
        this.emit('presence', {
          deviceId,
          status,
        });
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
   * Registers a correlated clock to provide timeline updates to the
   * service, and receive updates from it.
   *
   * * Use this method for a 'master' client controlling the experience.
   * * Use {@link synchroniseToTimeline} for a 'slave' client to wait until
   * another device provides a timeline to synchronise to.
   *
   * @param {CorrelatedClock} timelineClock
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @returns {Promise<CorrelatedClock>}
   * @public
   */
  provideTimelineClock(timelineClock, timelineType, contentId) {
    timelineClock.id = `providedTimelineClock_${contentId}`;
    if (this._connectPromise === null) {
      throw new Error('CloudSyncAdapter: provideTimelineClock: Not connected. Call connect() first.');
    }
    return this._connectPromise.then(() => {
      this._synchroniser.synchronise(timelineClock, timelineType, contentId);
      return timelineClock;
    });
  }

  /**
   * Waits for a timeline of given type and contentId and provides a
   * CorrelatedClock for it when it becomes available.
   *
   * * Use this method for a 'slave' client to be controlled by a remote timeline.
   * * Use {@link synchronise} for a 'master' client also providing updates to the server.
   *
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @return {Promise<CorrelatedClock>} resolving when the clock is available.
   * @public
   */
  requestTimelineClock(timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('CloudSyncAdapter: requestTimelineClock: Not connected. Call connect() first.');
    }

    // method to use in find() to test if a timeline object matches the timelineType and contentid.
    const matchTimeline = tl => tl.timelineType === timelineType &&
                                tl.contentId === contentId;

    console.warn('called requestTimelineClock');

    // create the clock object to return. It will become unavailable if the sync timeline goes away.
    const timelineClock = new clocks.CorrelatedClock(this.wallClock, {
      available: false,
    });
    timelineClock.id = `timelineClock_${contentId}`;

    return this._connectPromise.then(() => new Promise((resolve, reject) => {
      // Listen for new timelines being registered, and return a
      // promise resolving when it is found.
      console.debug('requestTimelineClock registering SyncTimelinesAvailable handler');

      // listen for timelines becoming available, resolve if one matches
      const handler = (timelines) => {
        console.debug('requestTimelineClock SyncTimelinesAvailable', timelines);

        // if a matching timeline is found, resolve to its id and stop listening.
        // Otherwise, we may have to wait for the next event of this kind to find it.
        const timeline = timelines.find(matchTimeline);
        if (timeline !== undefined) {
          const { timelineId } = timeline;
          this._synchroniser.subscribeTimeline(timelineId).then((responseCode) => {
            if (responseCode !== 0) {
              reject(new Error(`synchroniser.subscribeTimeline failed with code: ${responseCode}`));
            }

            this._synchroniser.syncClockToThisTimeline(timelineClock, timelineId);
            timelineClock.setAvailabilityFlag(true);
            resolve(timelineClock);
          });
        } else {
          console.debug('requestTimelineClock SyncTimelinesAvailable timeline clock unavailable.');
          timelineClock.setAvailabilityFlag(false);
        }
      };

      // request timelines available now, triggers SyncTimelinesAvailable event.
      this._synchroniser.on('SyncTimelinesAvailable', handler);
      this._synchroniser.getAvailableSyncTimelines().then(handler);
    })).catch((e) => {
      throw new Error(`cloud-sync-adapter: requestTimelineClock: ${e.message}`);
    });
  }

  /**
   * Send a message to this topic to all devices in the same session.
   *
   * @param {string} topic
   * @param {object} message
   */
  sendMessage(topic, message) {
    this._synchroniser.sendApplicationBroadcast(topic, message);
    return Promise.resolve();
  }
}

export default CloudSyncAdapter;

