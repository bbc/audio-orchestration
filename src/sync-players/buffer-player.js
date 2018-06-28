import bbcat from 'bbcat';
import Player from './player';

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
      this._outputs = [...Array(this.buffer.numChannels).keys()]
        .map(() => this.audioContext.createGain);
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
      // check that offset is valid
      if (offset < 0 || offset > this.buffer.duration) {
        throw new Error('offset must be >= 0 and < buffer.duration.');
      }

      // if we already have a playing source, stop it.
      if (this.source !== null) {
        this.source.stop(when);
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
   * @param when
   */
  pause(when) {
    if (this.source !== null) {
      this.source.stop(when);
    }

    return Promise.resolve(this);
  }

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

  get playbackRate() {
    if (this.state === 'playing') {
      return 1;
    }
    return 0;
  }
}

export default BufferPlayer;
