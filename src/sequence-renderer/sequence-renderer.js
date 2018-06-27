import Sequence from './sequence';

class SynchronisedSequenceRenderer {
  constructor(audioContext, clock, sequence) {
    this._audioContext = audioContext;
    this._clock = clock;
    this._sequence = sequence;
    this._activeObjectIds = [];
    this._activePlaybackItems = {};

    this.lookaheadDuration = 2.0;
    this.fadeInDuration = 0.2;
    this.fadeOutDuration = 0.2;

    this._clock.on('update', this.notify.bind(this));
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
   */
  removeObject(objectId) {
    this._activeObjectIds.remove(objectId);

    this.notify();
  }
}

export default SynchronisedSequenceRenderer;
