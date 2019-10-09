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
    } = {},
  ) {
    this._audioContext = audioContext;
    this._player = player;
    this._clock = clock;
    this._fadeOutDuration = fadeOutDuration;
    this._stereoOutput = stereoOutput;
    this._channelMapping = channelMapping;

    this._syncController = new SyncController(this._clock, this._player);

    // TODO: replace with stereo panner in stereo case, or gain node otherwise.
    this._output = new OutputRouter(this._audioContext, this._stereoOutput);

    this.stopped = false;
  }

  start() {
    this._player.prepare()
      // TODO implement start as separate from constructor
      // .then(() => this._syncController.start())
      .then(() => {
        switch (this._stereoOutput ? this._channelMapping : 'mono') {
          case 'stereo':
            this._player.outputs[0].connect(this._output.left);
            this._player.outputs[1].connect(this._output.right);
            break;
          case 'left':
            this._player.outputs[0].connect(this._output.left);
            break;
          case 'right':
            this._player.outputs[0].connect(this._output.right);
            break;
          case 'mono':
          default:
            this._player.outputs[0].connect(this._output.mono);
            break;
        }
      });
  }

  stop() {
    this._clock.setSpeed(0);
    this._syncController.stop();
    this.output.disconnect();
    this.stopped = true;
    return Promise.resolve();
  }

  fadeOut(when = this._audioContext.currentTime) {
    return new Promise((resolve) => {
      this._output.exponentialRamptoValueAtTime(1e-3, this._fadeOutDuration);
      setTimeout(() => {
        resolve();
      }, 1000 * ((when - this._audioContext.currentTime) + this._fadeOutDuration));
    }).then(() => this.stop());
  }

  get output() {
    return this._output.output;
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
      }),
    );
  }
}

export default ItemRendererFactory;
