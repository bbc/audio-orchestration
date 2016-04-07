import { Loader } from '../../core/_index';
import SegmentStream from './segment-stream';

export default class MetadataSegmentStream extends SegmentStream {
  constructor(context, definition) {
    super(context, new Loader('json'), definition);
    this._metadataCallback = null;
  }

  get metadataCallback() {
    return this._metadataCallback();
  }

  set metadataCallback(callback) {
    if (!callback || !(callback instanceof Function)) {
      throw new Error('Invalid parameter callback. Must be of type Function.');
    }

    this._metadataCallback = callback;
  }

  _addDataToSegment(data, n) {
    for (let i = 0; i < this._buffer.segments.length; i++) {
      const segment = this._buffer.segments[i];

      if (segment.n === n) {
        segment.metadata = data;

        // Pass the segment through to the metadata callback.
        if (this._metadataCallback) {
          this._metadataCallback(segment);
        }
      }
    }
  }
}
