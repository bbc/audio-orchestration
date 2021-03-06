/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
// Exports a function to generate metadata segments.

const metadataSegments = [
  [{ // Segment 1. 0 <= timens < 4.
    timens: 0,
    channel: 0,
    parameters: {
      position: {
        polar: true,
        az: 23.991423999999995,
        el: 2.8849009999999997,
        d: 39.737952999999990,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 0,
    channel: 1,
    parameters: {
      position: {
        polar: true,
        az: 18.117913000000005,
        el: 3.0894789999999990,
        d: 37.108921000000016,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }],
  [{ // Segment 2. 4 <= timens < 8.
    timens: 4075000000,
    channel: 0,
    parameters: {
      position: {
        polar: true,
        az: -126.16359399999999,
        el: 0.0000000000000000,
        d: 37.301979000000003,
      },
      gain: 0.5000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 4075000000,
    channel: 1,
    parameters: {
      position: {
        polar: true,
        az: -124.78084300000000,
        el: 0.0000000000000000,
        d: 40.731476000000008,
      },
      gain: 0.7500000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: 4,
      },
    },
  }],
  [{ // Segment 3. 8 <= timens < 12.
    timens: 8905000000,
    channel: 0,
    parameters: {
      position: {
        polar: true,
        az: 125.32779600000001,
        el: 3.3383640000000003,
        d: 34.345115999999997,
      },
      gain: 0.2500000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 8905000000,
    channel: 1,
    parameters: {
      position: {
        polar: true,
        az: 117.90708200000000,
        el: 3.3207080000000002,
        d: 34.527534000000003,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 10000000000,
    channel: 2,
    parameters: {
      position: {
        polar: true,
        az: 17.25165200000000,
        el: 0.000000000000000,
        d: 1.527534000000003,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }],
  [{ // Segment 4. 12 <= timens < 16.
    timens: 13000000000,
    channel: 0,
    parameters: {
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 13000000000,
    channel: 1,
    parameters: {
      position: {
        polar: true,
        az: -50.277201000000012,
        el: 0.0000000000000000,
        d: 49.765976000000009,
      },
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 15000000000,
    channel: 0,
    parameters: {
      position: {
        polar: true,
        az: 72.708357000000007,
        el: 2.7983690000000006,
        d: 40.965758999999998,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }, {
    timens: 15000000000,
    channel: 1,
    parameters: {
      position: {
        polar: true,
        az: 70.847567000000012,
        el: 3.0096820000000002,
        d: 38.091900000000003,
      },
      gain: 1.0000000000000000,
      diffuseness: 0.0000000000000000,
      dialogue: 0,
      othervalues: {
        bbcrenderer_rendertype: 'echoic',
        sourcetype: '4',
      },
    },
  }],
];

const defaultDuration = 4;
const createMetadata = (
  number, duration = defaultDuration, offset = 0, cutoff = duration,
) => {
  // Calculate which metadata segment shoud be used and the ratio to
  // compress/expand metadata times.
  const segmentIndex = (number - 1) % metadataSegments.length;
  const metadata = metadataSegments[segmentIndex];
  const durationRatio = duration / defaultDuration;

  // Caluclate where to filter out metadata based upon cutoff.
  const metadataStart = 1e9 * segmentIndex * defaultDuration;
  const metadataEnd = (1e9 * cutoff) / durationRatio + metadataStart;

  // Filter the relevant metadata, and scale and offset the metadata times.
  return metadata
    .filter((datum) => datum.timens < metadataEnd)
    .map((datum) => {
      const newDatum = { ...datum };
      newDatum.timens = (newDatum.timens - metadataStart)
        * durationRatio + 1e9 * offset;
      return newDatum;
    });
};

export default createMetadata;
