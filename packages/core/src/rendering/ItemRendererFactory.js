/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import {
  BufferPlayer,
  DashPlayer,
  ImagePlayer,
} from '../playback';
import ItemRenderer from './ItemRenderer';

class ItemRendererFactory {
  constructor(audioContext, imageContext, options = {}) {
    this._audioContext = audioContext;
    this._imageContext = imageContext;
    this._options = options;
    this._isSafari = options.isSafari || false;
  }

  /**
   * @returns {ItemRenderer}
   */
  getInstance(item, clock) {
    let player = null;

    const { source, duration } = item;
    let { channelMapping } = source;

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
      case 'image':
        channelMapping = 'none'; // to avoid setting up audio connections from the image player
        player = new ImagePlayer(
          this._audioContext,
          this._imageContext,
          source,
          duration,
        );
        break;
      default:
        throw new Error(`Cannot create a player for unknown source type ${source.type}`);
    }

    return new ItemRenderer(
      this._audioContext,
      player,
      clock,
      ({
        ...this._options,
        channelMapping,
        panning: source.panning,
        gain: source.gain,
      }),
    );
  }
}

export default ItemRendererFactory;
