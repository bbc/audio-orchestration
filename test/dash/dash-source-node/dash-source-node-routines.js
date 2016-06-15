import mockAudio from './../../audio';
import createMetadata from './../../metadata-generator';

const offsetManifest = {
  type: 'static',
  minBufferTime: 6,
  mediaPresentationDuration: 30,
  maxSegmentDuration: 2,
  programInformation: {
    moreInformationURL: 'http://example.org/',
    lang: undefined,
    title: 'Example MPD 1',
    source: null,
    copyright: null,
  },
  baseURL: ['http://example.org/some/mpd'],
  periods: [{
    id: 0,
    duration: 30,
    start: 2,
    baseUrl: null,
    adaptationSets: [{
      id: '0',
      mimeType: 'text/json',
      value: NaN,
      segmentTemplate: {
        duration: 96000,
        timescale: 48000,
        startNumber: 1,
        presentationTimeOffset: 0,
        media: '/md/dash_$Number.json',
      },
      representations: [{
        id: NaN,
        bandwidth: 129866,
      }],
    }, {
      id: '1',
      mimeType: 'audio/mp4',
      value: 5,
      segmentTemplate: {
        duration: 96000,
        timescale: 48000,
        startNumber: 1,
        presentationTimeOffset: 0,
        media: '/1/segment_$Number.m4a',
      },
      representations: [{
        id: 1,
        bandwidth: 129866,
      }],
    }, {
      id: '2',
      mimeType: 'audio/mp4',
      value: 5,
      segmentTemplate: {
        duration: 96000,
        timescale: 48000,
        startNumber: 1,
        presentationTimeOffset: 0,
        media: '/2/segment_$Number.m4a',
      },
      representations: [{
        id: 1,
        bandwidth: 129866,
      }],
    }],
  }],
};

const noValidStreamsManifest = {
  type: 'static',
  minBufferTime: 16,
  mediaPresentationDuration: 120,
  maxSegmentDuration: null,
  programInformation: {
    moreInformationURL: 'http://example.org/',
    lang: undefined,
    title: 'Example MPD 2',
    source: null,
    copyright: null,
  },
  baseURL: ['http://example.org/some/mpd'],
  periods: [{
    id: 0,
    duration: 120,
    start: 0,
    baseUrl: null,
    adaptationSets: [{
      id: '1',
      mimeType: 'text/text',
      value: 5,
      segmentTemplate: {
        duration: 96000,
        timescale: 48000,
        startNumber: 1,
        presentationTimeOffset: 0,
        media: '/subtitle/segment_$Number.m4a',
      },
      representations: [{
        id: 1,
        bandwidth: 129866,
      }],
    }],
  }],
};

const segmentsUrlPayloadMap = [
  {
    url: 'http://example.org/some/mpd/md/dash_1.json',
    payload: createMetadata(1, 2, 0),
  }, {
    url: 'http://example.org/some/mpd/md/dash_2.json',
    payload: createMetadata(2, 2, 2),
  }, {
    url: 'http://example.org/some/mpd/md/dash_3.json',
    payload: createMetadata(3, 2, 4),
  }, {
    url: 'http://example.org/some/mpd/md/dash_4.json',
    payload: createMetadata(4, 2, 6),
  }, {
    url: 'http://example.org/some/mpd/1/segment_1.m4a',
    payload: mockAudio[0],
  }, {
    url: 'http://example.org/some/mpd/1/segment_2.m4a',
    payload: mockAudio[1],
  }, {
    url: 'http://example.org/some/mpd/1/segment_3.m4a',
    payload: mockAudio[2],
  }, {
    url: 'http://example.org/some/mpd/1/segment_4.m4a',
    payload: mockAudio[3],
  }, {
    url: 'http://example.org/some/mpd/2/segment_1.m4a',
    payload: mockAudio[3],
  }, {
    url: 'http://example.org/some/mpd/2/segment_2.m4a',
    payload: mockAudio[2],
  }, {
    url: 'http://example.org/some/mpd/2/segment_3.m4a',
    payload: mockAudio[1],
  }, {
    url: 'http://example.org/some/mpd/2/segment_4.m4a',
    payload: mockAudio[0],
  },
];

const baseRoutine = {
  manifest: offsetManifest,
  segmentsUrlPayloadMap,
  primeParameters: {
    initial: 1,
    loop: false,
    offset: 3,
    duration: 3,
  },
  expected: {
    channelCount: 10,
  },
};

const loopRoutine = {
  manifest: offsetManifest,
  segmentsUrlPayloadMap,
  primeParameters: {
    initial: 2,
    loop: true,
    offset: 1,
    duration: 6,
    start: 4,
  },
  expected: {
    audioStreams: 2,
    metadataStreams: 1,
    channelCount: 10,
    segments: [
      {
        n: 0,
        number: 1,
        when: 0,
        offset: 1,
        duration: 1,
        metadata: createMetadata(1, 2, -1, 2),
      }, {
        n: 1,
        number: 2,
        when: 1,
        offset: 0,
        duration: 2,
        metadata: createMetadata(2, 2, 1, 2),
      }, {
        n: 2,
        number: 3,
        when: 3,
        offset: 0,
        duration: 1,
        metadata: createMetadata(3, 2, 3, 1),
      }, {
        n: 4,
        number: 1,
        when: 5,
        offset: 0,
        duration: 2,
        metadata: createMetadata(1, 2, 5, 2),
      }, {
        n: 5,
        number: 2,
        when: 7,
        offset: 0,
        duration: 2,
        metadata: createMetadata(2, 2, 7, 2),
      },
    ],
  },
};

const noValidStreamsRoutine = {
  manifest: noValidStreamsManifest,
  expected: {
    channelCount: 0,
  },
};

export default [
  baseRoutine,
  loopRoutine,
  noValidStreamsRoutine,
];
