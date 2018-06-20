/**
 * the tolerated offset between ideal and actual media clock.
 * @type {number}
 */
const DEFAULT_S_L_AUDIO = 0.06; // 60ms, was 30ms

/**
 * The expected time to fill and decode a buffer after seeking.
 * @type {number}
 */
const DEFAULT_T_BUFDELAY_AUDIO = 1.0;

/**
 * The AudioSyncController takes a timeline clock and a media player, and
 * controls the media player to keep its playback state in sync with the timeline
 * clock.
 */
class SyncController {
  /**
   * @param {CorrelatedClock} idealTimelineClock
   * @param {Player} mediaPlayer
   * @param {number} offset - the device's presentation delay
   */
  constructor(idealTimelineClock, mediaPlayer, {
    toleratedOffset = DEFAULT_S_L_AUDIO,
    bufferingDelay = DEFAULT_T_BUFDELAY_AUDIO,
  } = {}) {
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
    this.toleratedOffset = toleratedOffset;

    /**
     * @type {number}
     * @private
     */
    this.bufferingDelay = bufferingDelay;

    this.idealTimelineClock.on('change', () => {
      this.notify();
    });
    this.notify();
  }

  /**
   * Triggers a resync, if the clock is available.
   *
   * @private
   */
  notify() {
    if (this.idealTimelineClock.getAvailabilityFlag()) {
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

    const s = expectedMediaTime - actualMediaTime;
    const v = this.idealTimelineClock.getEffectiveSpeed();

    if (v === 0) {
      // need to pause
      this.strategyPaused();
    } else if (v === this.mediaPlayer.speed && Math.abs(s) < this.toleratedOffset) {
      // within tolerance and same speed, do nothing
      // TODO: was AMP check to see if speed needed to be adjusted, if offset was small.
    } else {
      // needs to seek
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

    // TODO: use buffered Interval if available in player, without a delay

    // seek to a later position, and schedule it later, as it takes time to prime the player
    if (this.bufferingDelay > 0) {
      const delay = this.bufferingDelay * v;
      seekPosition += delay;
    }

    // if the clock is running, initiate a seek and play.
    if (v > 0) {
      // syncTime is the root clock (audio context) time the media should start playing.
      const syncTime = this.idealTimelineClock.calcWhen(seekPosition * tr);

      // schedule seek: seekPosition is where to seek to relative to start of media
      this.mediaPlayer.seek(syncTime, seekPosition);
    }
  }
}

export default SyncController;
