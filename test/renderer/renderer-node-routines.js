import mockMetadata from '../metadata';

const testTimingRoutine = {
  metadata: [mockMetadata[0], mockMetadata[1]],
  channelCount: 2,
  runTime: 2,
  expectedChannelConfig: [{
    position: {
      x: -16.1369706396013,
      y: 36.25883454385085,
      z: 2.00000118212516,
    },
    gain: 1,
  }, {
    position: {
      x: -11.52312190967286,
      y: 35.21774652867223,
      z: 2.000002170312487,
    },
    gain: 1,
  }],
};

const testOrderRoutine = {
  metadata: [mockMetadata[1], mockMetadata[2], mockMetadata[0]],
  channelCount: 2,
  runTime: 6,
  expectedChannelConfig: [{
    position: {
      x: 30.115208985625834,
      y: -22.011629314262997,
      z: 0,
    },
    gain: 0.5,
  }, {
    position: {
      x: 33.45438980001761,
      y: -23.23482171756552,
      z: 0,
    },
    gain: 0.75,
  }],
};

const channelOutOfRangeRoutine = {
  metadata: [mockMetadata[0], mockMetadata[1], mockMetadata[2]],
  channelCount: 2,
  runTime: 10,
  expectedChannelConfig: [{
    position: {
      x: -27.973158932400214,
      y: -19.82648145843212,
      z: 2.000001343644853,
    },
    gain: 0.25,
  }, {
    position: {
      x: -30.461018898489257,
      y: -16.13310023944244,
      z: 2.0000021127835352,
    },
    gain: 1,
  }],
};

const partialADMRoutine = {
  metadata: [mockMetadata[3]],
  channelCount: 2,
  runTime: 13,
  expectedChannelConfig: [{
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    gain: 1,
  }, {
    position: {
      x: 38.27726739497467,
      y: 31.80413759255524,
      z: 0,
    },
    gain: 1,
  }],
};

export default [
  testTimingRoutine,
  testOrderRoutine,
  channelOutOfRangeRoutine,
  partialADMRoutine,
];
