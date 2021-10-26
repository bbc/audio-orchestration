/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * The SyncController ties a {@link Player} to a clock. It will play, pause, and seek
 * the media to keep it in sync with the given {@link CorrelatedClock}.
 */

/**
 * The tolerated offset in seconds between ideal and actual media clock.
 * @type {number}
 */
const DEFAULT_S_L_AUDIO = 0.06; // 60ms, was 30ms

/**
 * The expected time in seconds to fill and decode a buffer after seeking.
 * @type {number}
 */
const DEFAULT_T_BUFDELAY_AUDIO = 1.0;

/**
 * The interval period in seconds for checking the player progress, in addition to checks on clock
 * change events.
 * @type {number}
 */
const DEFAULT_RESYNC_PERIOD = 4.0;

class SyncController {
  /**
   * @param {CorrelatedClock} idealTimelineClock
   * @param {Player} mediaPlayer
   * @param {Object} options
   */
  constructor(idealTimelineClock, mediaPlayer, options = {}) {
    /**
     * @type {CorrelatedClock}
     * @private
     */
    this.idealTimelineClock = idealTimelineClock;

    /**
     * @type {Player}
     * @private
     */
    this.mediaPlayer = mediaPlayer;

    /**
     * @type {number}
     * @private
     */
    this.toleratedOffset = options.toleratedOffset !== undefined
      ? options.toleratedOffset : DEFAULT_S_L_AUDIO;

    /**
     * @type {number}
     * @private
     */
    this.bufferingDelay = options.bufferingDelay !== undefined
      ? options.bufferingDelay : (mediaPlayer.defaultBufferingDelay || DEFAULT_T_BUFDELAY_AUDIO);

    /**
     * @type {number}
     * @private
     */
    this.resyncIntervalPeriod = options.resyncIntervalPeriod !== undefined
      ? options.resyncIntervalPeriod : DEFAULT_RESYNC_PERIOD;

    /**
     * @type {boolean}
     * @private
     */
    this.stopped = false;

    // bind class method used as event handlers, to ensure `this` refers to the class instance,
    // not the event.
    this.notify = this.notify.bind(this);
    this.idealTimelineClock.on('change', this.notify);

    this.resyncInterval = setInterval(this.notify, this.resyncIntervalPeriod * 1000);
    this.notify();
  }

  /**
   * Stops listening to clock changes and updating the player periodically.
   */
  stop() {
    this.idealTimelineClock.removeListener('change', this.notify);
    clearInterval(this.resyncInterval);
    this.mediaPlayer.pause();
    this.stopped = true;
  }

  /**
   * Triggers a resync, if the clock is available.
   *
   * @private
   */
  notify() {
    if (!this.stopped && this.idealTimelineClock.getAvailabilityFlag()) {
      this.resync();
    }
  }

  /**
   * Find and use the best strategy for keeping the player in sync.
   *
   * @private
   */
  resync() {
    // convert to seconds by dividing by tick rate.
    const expectedMediaTime = this.idealTimelineClock.now() / this.idealTimelineClock.tickRate;
    const actualMediaTime = this.mediaPlayer.currentTime;
    const actualSpeed = this.mediaPlayer.playbackRate;

    const s = expectedMediaTime - actualMediaTime;
    const v = this.idealTimelineClock.getEffectiveSpeed();

    /* eslint-disable-next-line */
    // console.debug('SyncController.resync: v =', v, 'actualSpeed =', actualSpeed, 's =', s.toFixed(1), 'player.currentTime', actualMediaTime);

    if (v === 0) {
      // need to pause
      this.strategyPaused();
    } else if (v === actualSpeed && Math.abs(s) < this.toleratedOffset) {
      // within tolerance and same speed, do nothing
      // In AMP we'd check to see if speed needed to be adjusted here, if the offset was small.
    } else {
      // needs to seek
      // console.warn(`seeking, by ${s}, speed: ${actualSpeed} (clock: ${v})`);
      this.strategyMfs(s, v);
    }
  }

  /**
   * The Paused strategy stops playback immediately, and is used when the timeline
   * clock speed is 0.
   *
   * @private
   */
  strategyPaused() {
    this.mediaPlayer.pause();
  }

  /**
   * The Media Frame Skip (MFS) strategy seeks to a target position, at some time
   * shortly in the future, and begins playing from there.
   *
   * @param {number} s - the offset between actual and ideal playback time.
   * @param {number} v - the current ideal playback speed.
   *
   * @private
   */
  strategyMfs(s, v) {
    // The timeline clock might tick at a different rate than the media player.
    // The media player uses times in second-units.
    const tr = this.idealTimelineClock.tickRate;

    // where media should be right now:
    let seekPosition = this.idealTimelineClock.now() / tr;

    // TODO: use buffered interval if available in player, to seek without a buffering delay

    // seek to a later position, and schedule it later, as it takes time to prime the player
    // TODO: could try setting a sync time in the past so may not need to use bufferingDelay at all.
    if (this.bufferingDelay > 0) {
      const delay = this.bufferingDelay * v;
      seekPosition += delay;
    }

    // if the clock is running, initiate a seek and play.
    if (v > 0) {
      // syncTime is the root clock (audio context) time the media should start playing.
      const syncTime = this.idealTimelineClock.calcWhen(seekPosition * tr);

      // schedule seek: seekPosition is where to seek to relative to start of media

      if (seekPosition >= this.mediaPlayer.duration) {
        // console.debug('did not seek because past media end');
      } else if (seekPosition < 0) {
        // console.debug(`schedule in future, cannot seek to ${seekPosition} at ${syncTime}`);
        this.mediaPlayer.seek(syncTime - seekPosition, 0);
      } else {
        // console.debug(`regular seek to ${seekPosition} at ${syncTime}`);
        this.mediaPlayer.seek(syncTime, seekPosition);
      }
    }
  }
}

export default SyncController;
