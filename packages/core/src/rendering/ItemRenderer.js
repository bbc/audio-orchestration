/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import OutputRouter from './OutputRouter';
import SyncController from './SyncController';

/**
 * @private
 */
class ItemRenderer {
  constructor(
    audioContext,
    player,
    clock,
    {
      fadeOutDelay = 0.0,
      fadeOutDuration = 0.0,
      channelMapping = 'mono',
      panning = 0.0, // specified as [-1, 1]
      gain = 0.0, // specified as decibels in metadata
      syncControllerOptions,
    } = {}, // from options and item.source
  ) {
    this._audioContext = audioContext;
    this._player = player;
    this._clock = clock;
    this._fadeOutDelay = fadeOutDelay;
    this._fadeOutDuration = fadeOutDuration;
    this._channelMapping = channelMapping;
    this._panning = panning;
    this._gain = 10 ** (gain / 20); // convert fixed gain set in the item.source to linear gain
    this._objectGain = 1.0; // additional gain set at runtime by the allocation algorithm.
    this._fadingOut = false;

    this._syncController = new SyncController(this._clock, this._player, syncControllerOptions);

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

    this._outputRouter = new OutputRouter(this._audioContext, this._panning);

    this.stopped = false;
  }

  /**
   * Set additional gain for the object, set by the allocation algorithm.
   * @param {number} objectGain - linear gain multiplier
   */
  setObjectGain(objectGain) {
    if (objectGain || objectGain === 0) {
      this._objectGain = objectGain;
    } else {
      this._objectGain = 1.0;
    }

    this._gainNode.gain.value = this._gain * this._objectGain;
  }

  start() {
    this._player.prepare()
      .then(() => {
        if (this._channelMapping === 'stereo' && this._player.outputs.length >= 2) {
          // stereo source, represented at this stage as two mono outputs from the player
          const channelMerger = this._audioContext.createChannelMerger();
          this._player.outputs[0].connect(channelMerger, 0, 0);
          this._player.outputs[1].connect(channelMerger, 0, 1);
          channelMerger.connect(this._gainNode);
          this._gainNode.connect(this._outputRouter.stereoInput);
        } else if (this._channelMapping !== 'none') {
          // mono/left/right source
          this._player.outputs[0].connect(this._gainNode);
          this._gainNode.connect(this._outputRouter.input);
        }
      });
    // The syncController automatically starts when constructed so does not need to be started here.
  }

  stop() {
    this._clock.setSpeed(0);
    this._syncController.stop();
    this.output.disconnect();
    this.stopped = true;
    return Promise.resolve();
  }

  cancelFadeOut() {
    if (this._fadingOut) {
      this._fadingOut = false;
      this.output.gain.cancelScheduledValues(0.0);
      this.output.gain.setTargetAtTime(
        1.0,
        this._audioContext.currentTime,
        this._fadeOutDuration / 3,
      );
    }
  }

  fadeOut(when = this._audioContext.currentTime) {
    if (this._fadingOut) {
      return;
    }

    this._fadingOut = true;
    this.output.gain.setTargetAtTime(
      0,
      this._audioContext.currentTime + this._fadeOutDelay,
      this._fadeOutDuration / 3,
    );

    setTimeout(() => {
      if (!this._fadingOut) {
        return;
      }
      this.fadingOut = false;
      this.stop();
    }, 1000 * ((when - this._audioContext.currentTime) + this._fadeOutDuration));
  }

  get output() {
    return this._outputRouter.output;
  }
}

export default ItemRenderer;
