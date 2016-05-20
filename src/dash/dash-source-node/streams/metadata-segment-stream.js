import { Loader } from '../../../core/_index';
import SegmentStream from './segment-stream';

/**
 * A class to manage a single stream of metadata segments, synchronised to an
 * audio context.
 * @ignore
 */
export default class MetadataSegmentStream extends SegmentStream {
  /**
   * Constructs a new {@link MetadataSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  constructor(context, definition) {
    super(context, new Loader('json'), definition);
    this._metadataCallback = () => {};
  }

  /**
   * Gets the metadata callback function.
   * @return {function(segment: !Object)}
   *         The metadata callback function.
   */
  get metadataCallback() {
    return this._metadataCallback;
  }

  /**
   * Sets the metadata callback function.
   * @param  {function(segment: !Object)} callback
   *         The metadata callback function.
   */
  set metadataCallback(callback) {
    if (!callback || !(callback instanceof Function)) {
      throw new Error('Invalid parameter callback. Must be of type Function.');
    }

    this._metadataCallback = callback;
  }

  /**
   * Adds a data payload to a segment in the stream buffer and calls the
   * metadata callback, passing the segment with metadata attached.
   * @param  {!Object} data
   *         The data to add to the segment.
   * @param  {!number} n
   *         The number of the segment in the playback sequence.
   * @return {Object}
   *         The complete segment.
   */
  _addDataToSegment(data, n) {
    let segment = null;
    let isFound = false;
    let i = 0;

    while (!isFound && i < this._buffer.segments.length) {
      if (this._buffer.segments[i].n === n) {
        segment = this._buffer.segments[i];
        segment.metadata = data;

        // Offset the metadata time for the current loop.
        const loopOffset = segment.loopNumber * this._play.duration;
        for (let j = 0; j < segment.metadata.length; j++) {
          segment.metadata[j].timens += loopOffset * 1e9;
        }

        this._metadataCallback(segment);
        isFound = true;
      }
      i++;
    }

    return segment;
  }
}
