/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import EventEmitter from 'events';
import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import Sequence from './Sequence';
import ItemRendererFactory from './ItemRendererFactory';

/**
 * @class
 * @desc
 * The SequenceRenderer is responsible for orchestrating all audio sources related to a
 * {@link Sequence} on the device it is running on.
 */
class SequenceRenderer extends EventEmitter {
  /**
   * @param {AudioContext} audioContext
   * @param {CorrelatedClock} syncClock
   * @param {Sequence} sequence
   * @param Object [options]
   * @param bool [options.isSafari]
   * @param number [options.objectFadeOutDuration]
   * @param Object [options.syncControllerOptions]
   */
  constructor(audioContext, syncClock, sequence, {
    isSafari = false,
    objectFadeOutDuration = 0,
    lookaheadDuration = 2.0,
    sequenceFadeOutDuration = 0.2,
    imageContext,
    syncControllerOptions,
  } = {}) {
    super();

    /**
     * @type {AudioContext}
     * @private
     */
    this._audioContext = audioContext;

    /**
     * @type {ImageContext}
     * @private
     */
    this._imageContext = imageContext;

    /**
     * An object of optional settings passed through to the SyncControllers created by the renderer.
     *
     * @type {Object}
     * @private
     */
    this._syncControllerOptions = syncControllerOptions;

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
     * @type {Array<MdoAllocatedObject>}
     * @private
     */
    this._activeObjects = [];

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
    this._lookaheadDuration = lookaheadDuration;

    /**
     * @type {number}
     * duration of the fade to apply when a sequence renderer is stopped.
     */
    this._sequenceFadeOutDuration = sequenceFadeOutDuration;

    /**
     * @type {number}
     * duration of the fade to apply when an object is removed from this device.
     */
    this._objectFadeOutDuration = objectFadeOutDuration;

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
        imageContext: this._imageContext,
        isSafari,
        fadeOutDuration: this._objectFadeOutDuration,
        syncControllerOptions: this._syncControllerOptions,
      },
    );

    // listen for changes to the primary clock object
    this._clock.on('change', this.notify.bind(this));

    // clamp lookahead duration to minimum 300ms here in case someone sets it to 0 by mistake
    setInterval(this.notify.bind(this), Math.max(300, 1000 * (this._lookaheadDuration / 2)));
  }

  /**
   * Replace the set of active objects. Will cause new objects to start playing according to the
   * sequence and fade in, and removed objects to fade out immediately.
   *
   * @param {Array<MdoAllocatedObject>} newObjects
   */
  setActiveObjects(newObjects) {
    // trigger addition of objects not present in old list
    newObjects
      .filter((object) => !this._activeObjects
        .find((({ objectId }) => object.objectId === objectId)))
      .forEach((object) => this.addObject(object));

    // trigger removal of objects not present in new list
    this._activeObjects
      .filter((object) => !newObjects.find((({ objectId }) => object.objectId === objectId)))
      .forEach((object) => this.removeObject(object));

    // update gains for all objects - as now all should be present
    newObjects
      .forEach((object) => {
        const matchingObject = this._activeObjects
          .find((({ objectId }) => object.objectId === objectId));
        if (matchingObject) {
          matchingObject.objectGain = object.objectGain;
        }
      });

    // update the audio graph and player instances
    this.notify();
  }

  /**
   * Get a copy of the list of active object ids.
   *
   * @returns {Array<string>}
   */
  get activeObjectIds() {
    return this._activeObjects.map(({ objectId }) => objectId);
  }

  /**
   * Get a list of currently rendered item ids.
   *
   * @returns {Array<string>}
   */
  get activeItemIds() {
    return this._activeItemRenderers.map(({ itemId }) => itemId);
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
    /* eslint-disable-next-line */
    // console.debug(`start sequencerenderer at ${syncClockTime.toFixed(1)} (loop ${this._sequence.loop})`);
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
      try {
        if (fade) {
          renderer.output.gain.setTargetAtTime(0, syncTime, this._sequenceFadeOutDuration / 3);
        } else {
          renderer.output.gain.setValueAtTime(0, syncTime);
        }
      } catch (e) {
        // TODO nothing to do here (reached when trying to stop a non-running renderer)
      }
      setTimeout(
        () => {
          renderer.stop();
          /* eslint-disable-next-line */
          // console.debug(`renderer.stop at ${this._audioContext.currentTime} (output cut at ${syncTime}).`);
        },
        1000 * ((syncTime - this._audioContext.currentTime) + this._sequenceFadeOutDuration),
      );
    });
    this._activeItemRenderers = [];
  }

  /**
   * Mutes all outputs from this renderer and stops all players at the next suitable time after the
   * given delay.  Renders this renderer useless. If no out points are defined for the sequence,
   * stop immediately at the delay.
   *
   * @param {number} [delay = 0] - delay in seconds
   * @returns {number} the sync clock time when the output will be muted
   */
  stopAtOutPoint(delay = 0) {
    let out = this._sequence.nextOutPoint(this.contentTime + delay);

    if (this._sequence.outPoints.length === 0) {
      out = this.contentTime + delay;
    }
    const diff = out - this.contentTime;
    let syncClockTime = this._syncClock.now() + (diff * this._syncClock.tickRate);

    // TODO: audio from sequence started at calculated out point sometimes starts too early.
    // I think this is due to the sync clock changing and the sync-controller having decided
    // that the change was too small to seek the audio of the first sequence.

    /* eslint-disable-next-line */
    // console.debug(`stopAtOutPoint delay ${delay} contentTime ${this.contentTime} out point ${out}\n` +
    //               `syncClockTime: ${syncClockTime}\n` +
    //               `syncClock now: ${this._syncClock.now()}\n` +
    //              '');

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
    const objects = this._activeObjects
      .filter(({ objectId }) => this._sequence.objectIds.includes(objectId));

    // items that are active at or after the current time (or all items for looping sequences)
    const items = objects
      .map(({ objectId, objectGain }) => {
        // Get the items, for this object, that are active at or after the current time.
        const objectItems = this._sequence.items(
          objectId,
          this._sequence.loop ? 0 : this.contentTime,
        );
        // Add the object's objectGain property to each item for rendering
        return objectItems.map((item) => ({
          ...item,
          objectGain,
        }));
      })
      .reduce((acc, a) => acc.concat(a), []);

    // those active items that start within the lookahead window. Also include those at the start
    // of the sequence if contentTime + lookahead > duration.
    const activeItems = items
      .filter((item) => item.start <= this.contentTime + this._lookaheadDuration
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
    const { itemId, duration } = item;

    // define 'starting at the same time' to be within one milliseconds (10^-3)
    const existingRenderer = this._activeItemRenderers
      .find((r) => r.itemId === itemId && Math.abs(r.startTime - startTime) < 1.0e-3);
    if (existingRenderer !== undefined) {
      // Already have this item scheduled for the same time, just update the gain
      existingRenderer.renderer.cancelFadeOut();
      existingRenderer.renderer.setObjectGain(item.objectGain);
      return;
    }

    const clock = new CorrelatedClock(this._clock, {
      correlation: [startTime * this._clock.tickRate, 0],
      speed: 1,
      tickRate: 1,
    });

    /* eslint-disable-next-line */
    // console.debug(`at ${startTime.toFixed(1)}\t start ${itemId} (new item renderer) (sequence loop: ${this._sequence.loop})\n` +
    //               `syncClock.now: ${this._syncClock.now()}\n` +
    //               `clock.now: ${clock.now()}`);
    const renderer = this._itemRendererFactory.getInstance(item, clock);
    renderer.setObjectGain(item.objectGain);
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
    // console.debug('SSR: notify', this._sequence, this._activeObjects);
    const { contentTime } = this;
    const now = Math.max(this._clock.now() / this._clock.tickRate, 0);
    const sequenceStart = Math.floor(now / this._sequence.duration) * this._sequence.duration;

    // find all active items (active now up to lookaheadDuration) for all active and valid objects.
    const activeItems = this.getActiveItems();

    activeItems.forEach((item) => {
      const { start, duration } = item;

      // schedule item if it should have started before lookahead window and is still active
      if (start <= contentTime + this._lookaheadDuration && (start + duration) > contentTime) {
        this.scheduleItem(item, sequenceStart + start);
      }

      // For looped sequences, also check for the lookahead window at the sequence start if near
      // the end.
      if (this._sequence.loop) {
        if (start + this._sequence.duration < contentTime + this._lookaheadDuration) {
          this.scheduleItem(item, sequenceStart + this._sequence.duration + start);
        }
      }
    });

    // Immediately deactivate all renderers for abandoned items, that have run to completion since
    // the last notify call.
    this._activeItemRenderers
      .filter(({ startTime, duration }) => (startTime + duration < now))
      .forEach(({ renderer }) => {
        renderer.stop();
      });

    // Trigger a fade out for renderers that are no longer in the activeItems list, assuming it is
    // because the object has been removed.
    this._activeItemRenderers
      .filter(({ itemId }) => (activeItems.find((item) => item.itemId === itemId) === undefined))
      .forEach(({ renderer }) => {
        if (!renderer.stopped) {
          // fadeOut calls stop() after the fade has completed.
          renderer.fadeOut();
        }
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
   * @param {MdoAllocatedObject} object
   * @private
   */
  addObject(object) {
    this._activeObjects = [...this._activeObjects, object];
  }

  /**
   * Handle removal of an object.
   *
   * If any players are associated with this object, they will fade out and then be destroyed.
   *
   * @param {MdoAllocatedObject} object
   * @private
   */
  removeObject(object) {
    this._activeObjects = this._activeObjects
      .filter(({ objectId }) => object.objectId !== objectId);
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

export default SequenceRenderer;
