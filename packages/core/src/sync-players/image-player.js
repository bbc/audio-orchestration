import Player from './player';

class ImagePlayer extends Player {
  constructor(audioContext, imageContext, source, duration) {
    super(audioContext);

    const {
      src,
      priority,
      alt,
      effect,
    } = source;

    this.image = {
      src,
      alt,
      effect,
    };

    this.imageContext = imageContext;
    this.when = 0;
    this._duration = duration;
    this.offset = 0;
    this.source = null;
    this.state = 'ready';

    this.priority = priority;
  }

  play(when = null, offset = this.offset) {
    if (offset < 0 || offset > this._duration) {
      throw new Error('offset must be >= 0 and < buffer.duration.');
    }
    if (this.source === null) {
      this.source = this.imageContext.createImageSource(
        this.image,
        this._duration,
        this.priority,
      );
      this.source.connect(this.imageContext.destination);
      this.source.onended = () => {
        this.source.disconnect();
        this.source = null;
      };
    }

    this.when = when;
    this.offset = offset;

    this.source.play(when, offset);
    this.state = 'playing';
  }

  prepare() {
    if (this.src) {
      new Image().src = this.src;
    }
    return Promise.resolve();
  }

  pause() {
    if (this.source !== null && this.state === 'playing') {
      this.source.stop(this.imageContext.currentTime);
      this.state = 'ready';
    }
    return Promise.resolve();
  }

  get currentTime() {
    if (this.source === null) {
      return 0;
    }

    if (this.state === 'ready') {
      return this.offset;
    }

    const currentTime = this.imageContext.currentTime - (this.when - this.offset);
    return Math.max(this.offset, Math.min(currentTime, this._duration));
  }

  get playbackRate() {
    if (this.state === 'playing') {
      return 1;
    }
    return 0;
  }

  get duration() {
    return this._duration;
  }

  // eslint-disable-next-line class-methods-use-this
  get defaultBufferingDelay() {
    return 0;
  }
}

export default ImagePlayer;
