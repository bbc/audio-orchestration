// Exports routines to test MetadataSegmentStream.
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

const metadataSegments = [
  [{ // Segment 1.
    "timens": 0,
    "channel": 0,
    "parameters": {
      "position": {
        "polar": true,
        "az": 23.991423999999995,
        "el": 2.8849009999999997,
        "d": 39.737952999999990,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 0,
    "channel": 1,
    "parameters": {
      "position": {
        "polar": true,
        "az": 18.117913000000005,
        "el": 3.0894789999999990,
        "d": 37.108921000000016,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }],
  [{ // Segment 2.
    "timens": 4075000000,
    "channel": 0,
    "parameters": {
      "position": {
        "polar": true,
        "az": -126.16359399999999,
        "el": 0.0000000000000000,
        "d": 37.301979000000003,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 4075000000,
    "channel": 1,
    "parameters": {
      "position": {
        "polar": true,
        "az": -124.78084300000000,
        "el": 0.0000000000000000,
        "d": 40.731476000000008,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4"
      }
    }
  }],
  [{ // Segment 3.
    "timens": 8905000000,
    "channel": 0,
    "parameters": {
      "position": {
        "polar": true,
        "az": 125.32779600000001,
        "el": 3.3383640000000003,
        "d": 34.345115999999997,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 8905000000,
    "channel": 1,
    "parameters": {
      "position": {
        "polar": true,
        "az": 117.90708200000000,
        "el": 3.3207080000000002,
        "d": 34.527534000000003,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }],
  [{ // Segment 4.
    "timens": 12675000000,
    "channel": 0,
    "parameters": {
      "position": {
        "polar": true,
        "az": -47.169320999999997,
        "el": 0.0000000000000000,
        "d": 47.412010000000002,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 12675000000,
    "channel": 1,
    "parameters": {
      "position": {
        "polar": true,
        "az": -50.277201000000012,
        "el": 0.0000000000000000,
        "d": 49.765976000000009,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 13645000000,
    "channel": 0,
    "parameters": {
      "position": {
        "polar": true,
        "az": 72.708357000000007,
        "el": 2.7983690000000006,
        "d": 40.965758999999998,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }, {
    "timens": 13645000000,
    "channel": 1,
    "parameters": {
      "position": {
        "polar": true,
        "az": 70.847567000000012,
        "el": 3.0096820000000002,
        "d": 38.091900000000003,
      },
      "gain": 1.0000000000000000,
      "diffuseness": 0.0000000000000000,
      "dialogue": 0,
      "othervalues": {
        "bbcrenderer_rendertype": "echoic",
        "sourcetype": "4",
      },
    },
  }]
];

const segmentsUrlPayloadMap = [{
    url: '/segment_1.json',
    payload: metadataSegments[0],
  }, {
    url: '/segment_2.json',
    payload: metadataSegments[1],
  }, {
    url: '/segment_3.json',
    payload: metadataSegments[2],
  }, {
    url: '/segment_4.json',
    payload: metadataSegments[3],
}];

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
    channelCount: undefined,
    templateUrl: '/segment_$Number.json',
    bufferTime: 6,
};

const baseRoutine = {
  segmentsUrlPayloadMap: segmentsUrlPayloadMap,
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
      metadata: metadataSegments[0]
    }, {
      n: 1,
      number: 2,
      when: 4,
      offset: 0,
      duration: 4,
      metadata: metadataSegments[1]
    }, {
      n: 2,
      number: 3,
      when: 8,
      offset: 0,
      duration: 4,
      metadata: metadataSegments[2]
    }, {
      n: 3,
      number: 4,
      when: 12,
      offset: 0,
      duration: 4,
      metadata: metadataSegments[3]
    }],
  },
}

const loopTestRoutine = {
  segmentsUrlPayloadMap: segmentsUrlPayloadMap,
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
      metadata: metadataSegments[0]
    }, {
      n: 2,
      number: 2,
      when: 3,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[1]
    }, {
      n: 3,
      number: 3,
      when: 5,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[2]
    }, {
      n: 4,
      number: 4,
      when: 7,
      offset: 0,
      duration: 1,
      metadata: metadataSegments[3]
    }, {
      n: 6,
      number: 1,
      when: 9,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[0]
    }, {
      n: 7,
      number: 2,
      when: 11,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[1]
    }],
  },
}

const offsetTestRoutine = {
  segmentsUrlPayloadMap: segmentsUrlPayloadMap,
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
      metadata: metadataSegments[0]
    }, {
      n: 1,
      number: 2,
      when: 1,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[1]
    }, {
      n: 2,
      number: 3,
      when: 3,
      offset: 0,
      duration: 1,
      metadata: metadataSegments[2]
    }, {
      n: 3,
      number: 1,
      when: 4,
      offset: 1,
      duration: 1,
      metadata: metadataSegments[0]
    }, {
      n: 4,
      number: 2,
      when: 5,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[1]
    }, {
      n: 5,
      number: 3,
      when: 7,
      offset: 0,
      duration: 1,
      metadata: metadataSegments[2]
    }],
  },
}

const initialTestRoutine = {
  segmentsUrlPayloadMap: segmentsUrlPayloadMap,
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
      metadata: metadataSegments[2]
    }, {
      n: 1,
      number: 1,
      when: 1,
      offset: 1,
      duration: 1,
      metadata: metadataSegments[0]
    }, {
      n: 2,
      number: 2,
      when: 2,
      offset: 0,
      duration: 2,
      metadata: metadataSegments[1]
    }, {
      n: 3,
      number: 3,
      when: 4,
      offset: 0,
      duration: 1,
      metadata: metadataSegments[2]
    }],
  },
}

export default [
  baseRoutine,
  loopTestRoutine,
  offsetTestRoutine,
  initialTestRoutine,
]
