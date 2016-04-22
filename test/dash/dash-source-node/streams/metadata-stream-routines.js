import mockMetadata from './../../../metadata';

// Exports routines to test a MetadataSegmentStream.
// routine.segmentsUrlPayloadMap
//   - A map of url-to-payload mappings used to mock XMLHttpRequests.
// mapping.definition
//   - A definition object required to instantiate a MetadataSegmentStream.
// mapping.primeParameters
//   - A set of paramaters to prime a MetadataSegmentStream.
// mapping.startParameters
//   - A set of paramaters to start a MetadataSegmentStream.
// mapping.expected
//   - Hand calculated results expected when running the test routine. Includes
//     the number of segments expected to prime the buffer and the segments
//     in order of buffering with period metadata (when, offset, etc.) attached.

const segmentsUrlPayloadMap = [
  {
    url: '/segment_1.json',
    payload: mockMetadata[0],
  }, {
    url: '/segment_2.json',
    payload: mockMetadata[1],
  }, {
    url: '/segment_3.json',
    payload: mockMetadata[2],
  }, {
    url: '/segment_4.json',
    payload: mockMetadata[3],
  },
];

const baseMetadataDefinition = {
  id: 0,
  start: 0,
  duration: 16,
  segmentDuration: 4,
  segmentStart: 1,
  templateUrl: '/segment_$Number.json',
  bufferTime: 12,
};

const offsetMetadataDefinition = {
  id: 0,
  start: 1,
  duration: 8,
  segmentDuration: 2,
  segmentStart: 1,
  templateUrl: '/segment_$Number.json',
  bufferTime: 6,
};

const baseRoutine = {
  segmentsUrlPayloadMap,
  definition: baseMetadataDefinition,
  primeParameters: {
    initial: 0,
    loop: false,
    offset: 0,
    duration: 16,
  },
  startParameters: {
    contextStartTime: 0,
  },
  expected: {
    numberOfPrimeSegments: 3,
    segments: [{
      n: 0,
      number: 1,
      when: 0,
      offset: 0,
      duration: 4,
      metadata: mockMetadata[0],
    }, {
      n: 1,
      number: 2,
      when: 4,
      offset: 0,
      duration: 4,
      metadata: mockMetadata[1],
    }, {
      n: 2,
      number: 3,
      when: 8,
      offset: 0,
      duration: 4,
      metadata: mockMetadata[2],
    }, {
      n: 3,
      number: 4,
      when: 12,
      offset: 0,
      duration: 4,
      metadata: mockMetadata[3],
    }],
  },
};

const loopTestRoutine = {
  segmentsUrlPayloadMap,
  definition: offsetMetadataDefinition,
  primeParameters: {
    initial: 0,
    loop: true,
    offset: 0,
    duration: 8,
  },
  startParameters: {
    contextStartTime: 0,
  },
  expected: {
    numberOfPrimeSegments: 2,
    segments: [{
      n: 1,
      number: 1,
      when: 1,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[0],
    }, {
      n: 2,
      number: 2,
      when: 3,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[1],
    }, {
      n: 3,
      number: 3,
      when: 5,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[2],
    }, {
      n: 4,
      number: 4,
      when: 7,
      offset: 0,
      duration: 1,
      metadata: mockMetadata[3],
    }, {
      n: 6,
      number: 1,
      when: 9,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[0],
    }, {
      n: 7,
      number: 2,
      when: 11,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[1],
    }],
  },
};

const offsetTestRoutine = {
  segmentsUrlPayloadMap,
  definition: offsetMetadataDefinition,
  primeParameters: {
    initial: 0,
    loop: true,
    offset: 2,
    duration: 4,
  },
  startParameters: {
    contextStartTime: 10,
  },
  expected: {
    numberOfPrimeSegments: 3,
    segments: [{
      n: 0,
      number: 1,
      when: 0,
      offset: 1,
      duration: 1,
      metadata: mockMetadata[0],
    }, {
      n: 1,
      number: 2,
      when: 1,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[1],
    }, {
      n: 2,
      number: 3,
      when: 3,
      offset: 0,
      duration: 1,
      metadata: mockMetadata[2],
    }, {
      n: 3,
      number: 1,
      when: 4,
      offset: 1,
      duration: 1,
      metadata: mockMetadata[0],
    }, {
      n: 4,
      number: 2,
      when: 5,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[1],
    }, {
      n: 5,
      number: 3,
      when: 7,
      offset: 0,
      duration: 1,
      metadata: mockMetadata[2],
    }],
  },
};

const initialTestRoutine = {
  segmentsUrlPayloadMap,
  definition: offsetMetadataDefinition,
  primeParameters: {
    initial: 3,
    loop: true,
    offset: 2,
    duration: 4,
  },
  startParameters: {
    contextStartTime: 10,
  },
  expected: {
    numberOfPrimeSegments: 3,
    segments: [{
      n: 0,
      number: 3,
      when: 0,
      offset: 0,
      duration: 1,
      metadata: mockMetadata[2],
    }, {
      n: 1,
      number: 1,
      when: 1,
      offset: 1,
      duration: 1,
      metadata: mockMetadata[0],
    }, {
      n: 2,
      number: 2,
      when: 2,
      offset: 0,
      duration: 2,
      metadata: mockMetadata[1],
    }, {
      n: 3,
      number: 3,
      when: 4,
      offset: 0,
      duration: 1,
      metadata: mockMetadata[2],
    }],
  },
};

export default [
  baseRoutine,
  loopTestRoutine,
  offsetTestRoutine,
  initialTestRoutine,
];
