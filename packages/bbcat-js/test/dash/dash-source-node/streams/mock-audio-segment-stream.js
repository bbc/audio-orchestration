/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import AudioSegmentStream from
  '../../../../src/dash/dash-source-node/streams/audio-segment-stream';

export default class MockAudioSegmentStream extends AudioSegmentStream {
  constructor(context, definition) {
    super(context, definition);

    this.segmentLoadedCallback = () => {};
  }

  _addDataToSegment(data, n) {
    const segment = super._addDataToSegment(data, n);
    this.segmentLoadedCallback(segment);
  }
}
