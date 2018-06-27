import Sequence from './sequence';
import OutputRouter from './output-router';
/**
 * @class
 * @desc
 * The SynchronisedSequenceRenderer is responsible for orchestrating all audio sources related to a
 * {@link Sequence} on the device it is running on.
 *
 *
 *
 */
class SynchronisedSequenceRenderer {
  /**
   * @param {AudioContext} audioContext
   * @param {CorrelatedClock} clock
   * @param {Sequence} sequence
   */
  constructor(audioContext, clock, sequence, isStereo) {
    /**
     * @type {AudioContext}
     * @private
     */
    this._audioContext = audioContext;

    /**
     * @type {CorrelatedClock}
     * @private
     */
    this._clock = clock;

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
     * @type {Array}
     * @private
     */
    this._activePlaybackItems = {};

    /**
     * @type {number}
     * How far in advance are items downloaded and scheduled (seconds).
     */
    this.lookaheadDuration = 2.0;

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
    this._output = new OutputRouter(this._isStereo);

    // listen for changes to the master clock object
    this._clock.on('update', this.notify.bind(this));

    // set up the routing based on the sequence description
    this.initAudioGraph();
  }

  /**
   * Replace the set of active objects. Will cause new objects to start playing according to the
   * sequence and fade in, and removed objects to fade out immediately.
   *
   * @param {Array<string>} newObjectIds
   */
  set activeObjectIds(newObjectIds) {
    // trigger addition of objects not present in old list
    newObjectIds
      .filter(objectId => this._activeObjectIds.includes(objectId))
      .forEach(objectId => this.addObject(objectId));

    // trigger removal of objects not present in new list
    this._activeObjectIds
      .filter(objectId => !newObjectIds.includes(objectId))
      .forEach(objectId => this.removeObject(objectId));
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
    return this._output.output;
  }

  /**
   * Initialises the audio graph based on the sequence description.
   */

  /**
   * Notify this object that something changed and requires attention.
   *
   * Changes the audio routing graph, schedules parameter updates, and creates players as required.
   *
   * @private
   */
  notify() {
    console.debug('SSR: notify', this._sequence, this._activeObjectIds);
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
    this._activeObjectIds.push(objectId);

    this.notify();
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
    this._activeObjectIds.remove(objectId);

    this.notify();
  }
}

export default SynchronisedSequenceRenderer;
