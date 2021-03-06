/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import bbcat from '@bbc/audio-orchestration-bbcat-js';
import Player from './Player';

class BufferPlayer extends Player {
  constructor(audioContext, mediaUrl) {
    super(audioContext);

    /** @private */
    this.mediaUrl = mediaUrl;

    /** @private */
    this.buffer = null;

    /** @private */
    this.source = null;

    /** @private */
    this.when = 0;

    /** @private */
    this.offset = 0;

    /** @private */
    this.preparePromise = null;
  }

  /**
   * Prepare the player by downloading and decoding the audio if necessary.
   *
   * @returns {Promise<AudioBuffer>}
   */
  prepare() {
    // If we have a valid buffer, immediately resolve to that.
    if (this.buffer !== null) {
      return Promise.resolve(this.buffer);
    }

    // If we are already waiting for the download to finish, return the pending promise.
    if (this.preparePromise !== null) {
      return this.preparePromise;
    }

    // Otherwise, initiate a new loader and return a promise to the decoded buffer.
    const loader = new bbcat.core.AudioLoader(this.audioContext);
    this.preparePromise = loader.load([
      this.mediaUrl,
    ]).then((decodedBuffers) => {
      [this.buffer] = decodedBuffers;
      return this.buffer;
    }).then((buffer) => {
      this._outputs = [...Array(this.buffer.numberOfChannels).keys()]
        .map(() => this.audioContext.createGain());
      return buffer;
    }).then((buffer) => {
      this.state = 'ready';
      return buffer;
    });

    return this.preparePromise;
  }

  /**
   * @param {number} when
   * @param {number} offset
   *
   * @returns {Promise<BufferPlayer>}
   */
  play(when = this.audioContext.currentTime, offset = this.offset) {
    return this.prepare().then((buffer) => {
      // console.debug(`bufferPlayer.play() when: ${when} offset: ${offset}`);
      // check that offset is valid
      if (offset < 0 || offset > this.buffer.duration) {
        throw new Error('offset must be >= 0 and < buffer.duration.');
      }

      // if we already have a playing source, stop it.
      if (this.source !== null && this.state === 'playing') {
        try {
          this.source.stop();
          this.state = 'ready';
        } catch (e) {
          console.warn('bufferPlayer.pause():', e);
        }
      }

      // save new start time and offset.
      this.when = when;
      this.offset = offset;

      this.source = this.audioContext.createBufferSource();
      this.source.buffer = buffer;
      this.connectOutputs();

      this.source.onended = (e) => {
        // if it hasn't been replaced already, update the player state.
        // set offset to current position to handle pause/resume.
        if (e.target === this.source) {
          this.offset = this.currentTime;
          this.state = 'ready';
        }
      };

      this.source.start(when, offset);
      this.state = 'playing';

      return this;
    });
  }

  connectOutputs() {
    const splitter = this.audioContext.createChannelSplitter(this._outputs.length);
    this.source.connect(splitter);
    this._outputs.forEach((output, i) => {
      splitter.connect(output, i);
    });
  }

  /**
   * Pauses the player.
   *
   * @returns {Promise} resolving when the stop has been scheduled.
   */
  pause() {
    if (this.source !== null && this.state === 'playing') {
      try {
        this.source.stop();
        this.state = 'ready';
      } catch (e) {
        console.warn('bufferPlayer.pause():', e);
      }
    }

    return Promise.resolve();
  }

  /**
   * Get the current content time, the progress of the player.
   *
   * @returns {number}
   */
  get currentTime() {
    if (this.source === null || this.buffer === null) {
      return 0;
    }

    if (this.state === 'ready') {
      return this.offset;
    }

    const currentTime = this.audioContext.currentTime - (this.when - this.offset);
    return Math.max(this.offset, Math.min(currentTime, this.buffer.duration));
  }

  /**
   * Get the current playback rate (0 = paused, 1 = playing)
   *
   * @returns {number}
   */
  get playbackRate() {
    if (this.state === 'playing') {
      return 1;
    }
    return 0;
  }

  /**
   * get the default buffering delay for this type of player.
   *
   * @returns {number}
   */
  /* eslint-disable-next-line class-methods-use-this */
  get defaultBufferingDelay() {
    return 0;
  }

  get duration() {
    if (this.buffer === null) {
      return 0;
    }

    return this.buffer.duration;
  }
}

export default BufferPlayer;
