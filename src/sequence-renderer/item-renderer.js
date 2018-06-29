import OutputRouter from './output-router';
import SyncPlayers from '../sync-players';

const { SyncController, BufferPlayer, DashPlayer } = SyncPlayers;

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
  }

  start() {
    this._player.prepare()
      // .then(() => this._syncController.start()) // TODO implement start as separate from constructor
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
  constructor(audioContext, options) {
    this._audioContext = audioContext;
    this._options = options;
  }

  /**
   * @returns {Promise<ItemRenderer>}
   */
  getInstance(source, clock) {
    return new Promise((resolve) => {
      switch (source.type) {
        case 'dash':
          resolve(new DashPlayer(
            this._audioContext,
            source.url,
            [source.adaptationSetId],
          ));
          break;
        case 'buffer':
          resolve(new BufferPlayer(
            this._audioContext,
            source.url,
          ));
          break;
        default:
          throw new Error(`Cannot create a player for unknown source type ${source.type}`);
      }
    }).then(player => new ItemRenderer(
      this._audioContext,
      player,
      clock,
      Object.assign({}, this._options, {
        channelMapping: source.channelMapping,
      }),
    ));
  }
}

export default ItemRendererFactory;
