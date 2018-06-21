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

      this._synchroniser.on('SyncTimelinesAvailable', (timelines) => {
        console.log(timelines);
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
   * @returns {Promise}
   * @public
   */
  synchronise(timelineClock, timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('Synchroniser not available. call connect() before synchronise().');
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
  synchroniseToTimeline(timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('Synchroniser not available. call connect() before synchroniseToTimeline().');
    }

    const matchTimeline = tl => tl.timelineType === timelineType &&
                                tl.contentId === contentId;

    return this._connectPromise.then(() => {
      return this._synchroniser.getAvailableSyncTimelines();
    }).then((availableTimelines) => {
      // first check the currently available timelines.
      const timeline = availableTimelines.find(matchTimeline);
      console.log(`cloud-sync-adapter: getAvailableSyncTimelines: selected timeline:`, timeline);
      return timeline !== undefined ? timeline.timelineId : null;
    }).then((timelineId) => {
      // if it is already available, resolve to its id immediately.
      if (timelineId !== null) {
        return timelineId;
      }

      // Otherwise listen for new timelines being registered, and return a
      // promise resolving when it is found.
      return new Promise((resolve, reject) => {
        this._synchroniser.on('SyncTimelinesAvailable', (timelines) => {
          const timeline = timelines.find(matchTimeline);

          // if a matching timeline is found, resolve to its id. Otherwise, we
          // may have to wait for the next event of this kind to find it.
          if (timeline !== undefined) {
            console.log(`cloud-sync-adapter: SyncTimelinesAvailable: selected timeline:`, timeline);
            resolve(timeline.timelineId);
          }
        });
      });
    }).then(timelineId =>
      // Then subscribe to the specific timeline id matching the content and type.
      // return a promise resolving to the timeline clock when it becomes available.
      this._synchroniser.subscribeTimeline(timelineId).then((responseCode) => {
        console.log('subscribed to timeline.', timelineId);
        if (responseCode !== 0) {
          throw new Error('could not subscribe to timeline');
        }

        return new Promise((resolve, reject) => {
          this._synchroniser.on('TimelineAvailable', (id) => {
            if (id === timelineId) {
              console.log('cloud-sync-adapter: subscribedTimeline: TimelineAvailable:', id);
              resolve(this._synchroniser.getTimelineClockById(id));
            }
          });
        });
      }));
  }
}

export default CloudSyncAdapter;
