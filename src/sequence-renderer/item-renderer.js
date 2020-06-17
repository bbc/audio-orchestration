import OutputRouter from './output-router';
import {
  SyncController,
  BufferPlayer,
  DashPlayer,
} from '../sync-players';

/**
 * @private
 */
class ItemRenderer {
  constructor(
    audioContext,
    player,
    clock,
    {
      fadeOutDuration = 0.2,
      stereoOutput = true,
      channelMapping = 'mono',
      panning = 0.0,
      gain = 0.0, // specified as decibels in metadata
    } = {}, // item.source
  ) {
    this._audioContext = audioContext;
    this._player = player;
    this._clock = clock;
    this._fadeOutDuration = fadeOutDuration;
    this._stereoOutput = stereoOutput;
    this._channelMapping = channelMapping;
    this._panning = panning;
    this._gain = 10 ** (gain / 20); // convert fixed gain set in the item.source to linear gain
    this._objectGain = 1.0; // additional gain set at runtime by the allocation algorithm.

    this._syncController = new SyncController(this._clock, this._player);

    // TODO: Implement handling of stereo files

    // For compatibility with old metadata format, map to new panning parameter
    if (this._panning === undefined) {
      switch (this._channelMapping) {
        case 'left':
          this._panning = -1;
          break;
        case 'right':
          this._panning = 1;
          break;
        case 'mono':
        default:
          this._panning = 0;
          break;
      }
    }

    this._gainNode = this._audioContext.createGain();
    this._gainNode.gain.value = this._gain * this._objectGain;

    this._outputRouter = new OutputRouter(this._audioContext, this._stereoOutput, this._panning);

    this.stopped = false;
  }

  /**
   * Set additional gain for the object, set by the allocation algorithm.
   * @param {number} gain
   */
  setObjectGain(objectGain) {
    if (objectGain || objectGain === 0) {
      this._objectGain = objectGain;
    } else {
      this._objectGain = 1.0;
    }

    this._gainNode.gain.value = this._gain * this._objectGain;
  }

  // TODO implement start as separate from constructor
  // .then(() => this._syncController.start())
  start() {
    this._player.prepare()
      .then(() => {
        this._player.outputs[0].connect(this._gainNode);
        this._gainNode.connect(this._outputRouter.input);
      });
  }

  stop() {
    this._clock.setSpeed(0);
    this._syncController.stop();
    this.output.disconnect();
    this.stopped = true;
    return Promise.resolve();
  }

  // TODO: Check whether this code is called
  fadeOut(when = this._audioContext.currentTime) {
    return new Promise((resolve) => {
      this._outputRouter.output.gain.exponentialRamptoValueAtTime(1e-3, this._fadeOutDuration);
      setTimeout(() => {
        resolve();
      }, 1000 * ((when - this._audioContext.currentTime) + this._fadeOutDuration));
    }).then(() => this.stop());
  }

  get output() {
    return this._outputRouter.output;
  }
}

class ItemRendererFactory {
  constructor(audioContext, options = {}) {
    this._audioContext = audioContext;
    this._options = options;
    this._isSafari = options.isSafari || false;
  }

  /**
   * @returns {ItemRenderer}
   */
  getInstance(source, clock) {
    let player = null;

    switch (source.type) {
      case 'dash':
        player = new DashPlayer(
          this._audioContext,
          this._isSafari ? (source.urlSafari || source.url) : source.url,
          [source.adaptationSetId || '0'], // TODO hard-coded default name for ffmpeg dash manifests
        );
        break;
      case 'buffer':
        player = new BufferPlayer(
          this._audioContext,
          source.url,
        );
        break;
      default:
        throw new Error(`Cannot create a player for unknown source type ${source.type}`);
    }

    return new ItemRenderer(
      this._audioContext,
      player,
      clock,
      Object.assign({}, this._options, {
        channelMapping: source.channelMapping,
        panning: source.panning,
        gain: source.gain,
      }),
    );
  }
}

export default ItemRendererFactory;
