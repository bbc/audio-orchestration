import EventEmitter from 'events';
import Clocks from 'dvbcss-clocks';
import Sequence from './sequence';
import ItemRendererFactory from './item-renderer';

const { CorrelatedClock } = Clocks;

const MUTE_GAIN = 1.0e-6;

/**
 * @class
 * @desc
 * The SynchronisedSequenceRenderer is responsible for orchestrating all audio sources related to a
 * {@link Sequence} on the device it is running on.
 */
class SynchronisedSequenceRenderer extends EventEmitter {
  /**
   * @param {AudioContext} audioContext
   * @param {CorrelatedClock} syncClock
   * @param {Sequence} sequence
   */
  constructor(audioContext, syncClock, sequence, isStereo) {
    super();

    /**
     * @type {AudioContext}
     * @private
     */
    this._audioContext = audioContext;

    /**
     * @type {CorrelatedClock}
     * @private
     */
    this._syncClock = syncClock;

    /**
     * A clock for the item renderers initially paused at time 0.
     *
     * @type {CorrelatedClock}
     * @private
     */
    this._clock = new CorrelatedClock(this._syncClock, {
      correlation: {
        parentTime: 0,
        childTime: 0,
      },
      speed: 0,
      tickRate: this._syncClock.tickRate,
    });

    /**
     * @type {Sequence}
     * @private
     */
    this._sequence = sequence;

    /**
     * @type {boolean}
     * @private
     */
    this._isStereo = isStereo;

    /**
     * @type {Array<string>}
     * @private
     */
    this._activeObjectIds = [];

    /**
     * @type {Map<ItemRenderer>}
     * @private
     */
    this._activeItemRenderers = [];

    /**
     * @type {number}
     * How far in advance are items downloaded and scheduled (seconds).
     *
     * @private
     */
    this._lookaheadDuration = 2.0;

    /**
     * @type {fadeInDuration}
     * How long does the transition on newly enabled objects last (seconds).
     */
    this.fadeInDuration = 0.2;

    /**
     * @type {fadeOutDuration}
     * How long does the transition on newly removed objects last (seconds).
     */
    this.fadeOutDuration = 0.2;

    /**
     * @type {RendererOutputRouter}
     * @private
     */
    this._output = this._audioContext.createGain();

    /**
     * @type {boolean}
     * @private
     */
    this._stopped = false;

    /**
     * @type {number}
     * @private
     */
    this._lastNotifyContentTime = 0;

    /**
     * @type {ItemRendererFactory}
     * @private
     */
    this._itemRendererFactory = new ItemRendererFactory(
      this._audioContext,
      {
        stereoOutput: isStereo,
      },
    );

    // listen for changes to the master clock object
    this._clock.on('change', this.notify.bind(this));
    setInterval(this.notify.bind(this), 1000 * (this._lookaheadDuration / 2));
  }

  /**
   * Replace the set of active objects. Will cause new objects to start playing according to the
   * sequence and fade in, and removed objects to fade out immediately.
   *
   * @param {Array<string>} newObjectIds
   */
  setActiveObjectIds(newObjectIds) {
    // trigger addition of objects not present in old list
    newObjectIds
      .filter(objectId => !this._activeObjectIds.includes(objectId))
      .forEach(objectId => this.addObject(objectId));

    // trigger removal of objects not present in new list
    this._activeObjectIds
      .filter(objectId => !newObjectIds.includes(objectId))
      .forEach(objectId => this.removeObject(objectId));

    // update the audio graph and player instances
    this.notify();
  }

  /**
   * Get a copy of the list of active object ids.
   *
   * @returns {Array<string>}
   */
  get activeObjectIds() {
    return this._activeObjectIds.slice();
  }

  /**
   * Get a copy of the sequence being played by this Renderer
   *
   * @returns {Sequence}
   */
  get sequence() {
    // create a deep copy by serialising and deserialising
    return Sequence.deserialise(this._sequence.serialise());
  }

  /**
   * Get an output gain node that can be connected to any further processing.
   *
   * It has a single output, that can have either one or two channels.
   *
   * @returns {GainNode}
   */
  get output() {
    return this._output;
  }

  /**
   * @param {number} syncClockTime
   * @param {number} offset - in seconds, where in the sequence playback should start.
   */
  start(syncClockTime, offset = 0) {
    this._stopped = false;
    this._clock.setCorrelationAndSpeed({
      parentTime: syncClockTime,
      childTime: offset * this._syncClock.tickRate,
    }, 1);
  }

  /**
   * Mutes all outputs from this renderer and stops all players at the given AudioContext syncTime.
   *
   * @param {number} syncClockTime
   * @param {boolean} fade
   */
  stop(syncClockTime, fade = true) {
    const syncTime = this._syncClock.calcWhen(syncClockTime);
    this._stopped = true;
    this._activeItemRenderers.forEach(({ renderer }) => {
      if (fade) {
        renderer.output.gain.setTargetAtTime(MUTE_GAIN, syncTime, this.fadeOutDuration / 3);
      } else {
        renderer.output.gain.setValueAtTime(MUTE_GAIN, syncTime);
      }
      setTimeout(
        () => {
          renderer.stop();
          console.debug(`renderer.stop at ${this._audioContext.currentTime}`);
        },
        1000 * ((syncTime - this._audioContext.currentTime) + this.fadeOutDuration),
      );
    });
    this._activeItemRenderers = [];
  }

  /**
   * Mutes all outputs from this renderer and stops all players at the next suitable time after the
   * given delay.  Renders this renderer useless.
   *
   * @param {number} delay, in seconds
   * @returns {number} the context time when the output will be muted
   */
  stopAtOutPoint(delay = 0) {
    const out = this._sequence.nextOutPoint(this.contentTime + delay);
    console.debug('stopAtOutPoint:', this.contentTime, delay, out);
    const syncTime = this._clock.calcWhen(out * this._clock.tickRate);
    let syncClockTime = this._syncClock.fromRootTime(syncTime);

    // if this is called after the end of the sequence, we may have picked a stop time in the past
    // (the end of the sequence). Avoid this by clamping the chosen time to the current time.
    if (syncClockTime < this._syncClock.now()) {
      syncClockTime = this._syncClock.now() + (delay * this._syncClock.tickRate);
    }

    this.stop(syncClockTime, true);
    return syncClockTime;
  }


  /**
   * Gets all items active at the current time, or within the lookahead window.
   *
   * Returns every item at most once.
   *
   * @returns {Array<MdoItem>}
   * @private
   */
  getActiveItems() {
    // Object ids that are valid for the sequence (ensure this now to avoid error checking later)
    const objectIds = this._activeObjectIds
      .filter(objectId => this._sequence.objectIds.includes(objectId));

    // items that are active at or after the current time (or all items for looping sequences)
    const items = objectIds
      .map(objectId => this._sequence.items(objectId, this._sequence.loop ? 0 : this.contentTime))
      .reduce((acc, a) => acc.concat(a), []);

    // those active items that start within the lookahead window. Also include those at the start
    // of the sequence if contentTime + lookahead > duration.
    const activeItems = items
      .filter(item => item.start <= this.contentTime + this._lookaheadDuration
        || item.start <= (this.contentTime + this._lookaheadDuration) % this._sequence.duration);

    return activeItems;
  }

  /**
   * schedules the given item, if it hasn't already been scheduled for the same time.
   *
   * @param {MdoItem} item
   * @param {number} startTime in seconds
   * @private
   */
  scheduleItem(item, startTime) {
    const { itemId, duration, source } = item;

    const existingRenderer = this._activeItemRenderers
      .find(r => r.itemId === itemId && r.startTime === startTime);
    if (existingRenderer !== undefined) {
      // Already have this item scheduled for the same time.
      return;
    }

    const clock = new CorrelatedClock(this._clock, {
      correlation: [startTime * this._clock.tickRate, 0],
      speed: 1,
      tickRate: 1,
    });

    const renderer = this._itemRendererFactory.getInstance(source, clock);
    renderer.output.connect(this._output);
    renderer.start();

    this._activeItemRenderers.push({
      itemId,
      renderer,
      startTime,
      duration,
    });
  }

  /**
   * Notify this object that something changed and requires attention.
   *
   * Changes the audio routing graph, schedules parameter updates, and creates players as required.
   *
   * @private
   */
  notify() {
    // do not schedule any new items after the renderer has been stopped.
 
    if (this._stopped) {
      return;
    }
    // console.debug('SSR: notify', this._sequence, this._activeObjectIds);
    const { contentTime } = this;
    const now = this._clock.now() / this._clock.tickRate;
    const sequenceStart = Math.floor(now / this._sequence.duration) * this._sequence.duration;

    // find all active items (active now up to lookaheadDuration) for all active and valid objects.
    const activeItems = this.getActiveItems();

    activeItems.forEach((item) => {
      const { start, duration } = item;

      // schedule item if it should have started before now and is still active
      if (start <= contentTime && (start + duration) > contentTime) {
        this.scheduleItem(item, sequenceStart + start);
      }

      // schedule item if it starts within lookahead window in the future. For looped sequences,
      // also check for the lookahead window at the sequence start if near the end.
      if (this._sequence.loop) {
        if (start + this._sequence.duration < contentTime + this._lookaheadDuration) {
          this.scheduleItem(item, sequenceStart + this._sequence.duration + start);
        }
      }
    });


    // deactivate all renderers for abandoned items: Those that have run to completion,
    // and those for items not in the activeItems list.
    this._activeItemRenderers
      .filter(({ itemId, startTime, duration }) =>
        (startTime + duration < now)
          || (activeItems.find(item => item.itemId === itemId) === undefined))
      .forEach((r) => {
        r.renderer.stop();
      });

    // delete references to all stopped item renderers
    this._activeItemRenderers = this._activeItemRenderers
      .filter(({ renderer }) => !renderer.stopped);

    // Emit ended event some time after the end of the sequence duration
    if (contentTime > this._sequence.duration
        && this._lastNotifyContentTime <= this._sequence.duration) {
      this.emit('ended');
    }
    this._lastNotifyContentTime = contentTime;
  }

  /**
   * Handle addition of an object.
   *
   * Add it to the list of active objects, and the next {@link notify} call will create the players
   * and schedule the fade-in once the player has started playing.
   *
   * @param {string} objectId
   * @private
   */
  addObject(objectId) {
    this._activeObjectIds = [...this.activeObjectIds, objectId];
  }

  /**
   * Handle removal of an object.
   *
   * If any players are associated with this object, they will fade out and then be destroyed.
   *
   * @param {string} objectId
   * @private
   */
  removeObject(objectId) {
    this._activeObjectIds = this._activeObjectIds.filter(o => o !== objectId);
  }

  /**
   * Gets the current contentTime in seconds.
   *
   * @returns {number}
   */
  get contentTime() {
    const now = this._clock.now() / this._clock.tickRate;
    if (this._sequence.loop) {
      return now % this._sequence.duration;
    }
    return now;
  }
}

export default SynchronisedSequenceRenderer;
