/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import EventEmitter from 'events';

class Player extends EventEmitter {
  constructor(audioContext) {
    super();

    /**
     * @private
     *
     * A reference to the AudioContext object used for creating AudioNodes.
     *
     * @type {AudioContext}
     * @private
     */
    this.audioContext = audioContext;

    /**
     * The output of this player, a unity-gain GainNode.
     *
     * @type {AudioNode}
     * @private
    */
    this._outputs = [];

    /**
     * The player state.
     */
    this.currentState = 'uninitialised';
  }

  /**
   * Begin playing synchronised to a specified AudioContext time.
   *
   * @param {number} when - AudioContext time (seconds) to synchronise to.
   * @param {number} offset - position (seconds) within the media to begin playing from.
   *
   * @abstract
   */
  /* eslint-disable-next-line class-methods-use-this, no-unused-vars */
  play(when, offset = 0) {
    throw new Error('Player.play() is not implemented.');
  }

  /**
   * Pause playback immediately.
   *
   * @abstract
   */
  /* eslint-disable-next-line class-methods-use-this, no-unused-vars */
  pause() {
    throw new Error('Player.pause() is not implemented.');
  }

  /**
   * Move the playhead and resume playback at an AudioContext time, to a content time.
   *
   * @param {number} when - AudioContext time (seconds) to synchronise to.
   * @param {number} offset - position (seconds) within the media to begin playing from.
   */
  seek(when = this.audioContext.currentTime, offset = 0) {
    return this.pause()
      .then(this.play(when, offset));
  }

  /**
   * @returns {number} - the current playhead position (seconds) in the content.
   *
   * @abstract
   */
  /* eslint-disable-next-line class-methods-use-this */
  get currentTime() {
    return 0;
  }

  /**
   * @returns {number} - the current playback rate (0 for paused, 1 for playing normally).
   *
   * @abstract
   */
  /* eslint-disable-next-line class-methods-use-this */
  get playbackRate() {
    return 0;
  }

  /**
   * @returns {AudioNode} - An AudioNode that can be connected to other AudioContext nodes.
   *
   * @final
   */
  get outputs() {
    return this._outputs;
  }

  /**
   * Sets the state and emits a state change event.
   * @emits statechange
   * @private
   */
  set state(state) {
    this.currentState = state;
    this.emit('statechange', { state });
  }

  /**
   * @public
   */
  get state() {
    return this.currentState;
  }
}

export default Player;
