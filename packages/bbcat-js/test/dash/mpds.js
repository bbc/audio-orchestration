/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
// Exports manifests for testing.
// mpd.text
//   - Raw MPD in text form.
// mpd.json
//   - Hand-transcribed MPD to corresponding Javascript-object format.

const mpd1 = {
  text:
    `<?xml version="1.0"?>
    <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static"
      minBufferTime="PT12.00S" mediaPresentationDuration="PT0H3M40.00S"
      maxSegmentDuration="PT0H0M4.0S"
      profiles="urn:mpeg:dash:profile:full:2011">
    <ProgramInformation moreInformationURL="http://example.org/">
      <Title>Example MPD 1</Title>
    </ProgramInformation>
    <BaseURL>http://example.org/some/mpd</BaseURL>
    <Period duration="PT0H3M40.00S">
      <AdaptationSet segmentAlignment="true" id="0" mimeType="text/json">
        <SegmentTemplate startNumber="1" presentationTimeOffset="0"
          timescale="48000" duration="192000"
          media="/metadata/dash-$Number.json" />
        <Representation id="metadata" bandwidth="129866" />
      </AdaptationSet>
      <AdaptationSet segmentAlignment="true" id="1" mimeType="audio/mp4"
        codecs="mp4a.40.2" audioSamplingRate="48000" value="5">
        <SegmentTemplate startNumber="1" presentationTimeOffset="0"
        timescale="48000" duration="192000" media="/1/segment_$Number.m4a" />
        <Representation id="1" bandwidth="129866" />
      </AdaptationSet>
      <AdaptationSet segmentAlignment="true" id="2" mimeType="audio/mp4"
        codecs="mp4a.40.2" audioSamplingRate="48000" value="5">
        <SegmentTemplate startNumber="1" presentationTimeOffset="0"
        timescale="48000" duration="192000" media="/2/segment_$Number.m4a" />
        <Representation id="1" bandwidth="129866" />
      </AdaptationSet>
    </Period>
    </MPD>`,
  json: {
    type: 'static',
    minBufferTime: 12,
    mediaPresentationDuration: 220,
    maxSegmentDuration: 4,
    availabilityStartTime: null,
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
      duration: 220,
      start: 0,
      baseUrl: null,
      adaptationSets: [{
        id: '0',
        mimeType: 'text/json',
        value: NaN,
        audioChannelConfiguration: null,
        segmentTemplate: {
          duration: 192000,
          timescale: 48000,
          startNumber: 1,
          presentationTimeOffset: 0,
          media: '/metadata/dash-$Number.json',
          initialization: null,
        },
        representations: [{
          id: 'metadata',
          bandwidth: 129866,
        }],
        baseURL: null,
      }, {
        id: '1',
        mimeType: 'audio/mp4',
        value: 5,
        audioChannelConfiguration: null,
        segmentTemplate: {
          duration: 192000,
          timescale: 48000,
          startNumber: 1,
          presentationTimeOffset: 0,
          media: '/1/segment_$Number.m4a',
          initialization: null,
        },
        representations: [{
          id: '1',
          bandwidth: 129866,
        }],
        baseURL: null,
      }, {
        id: '2',
        mimeType: 'audio/mp4',
        value: 5,
        audioChannelConfiguration: null,
        segmentTemplate: {
          duration: 192000,
          timescale: 48000,
          startNumber: 1,
          presentationTimeOffset: 0,
          media: '/2/segment_$Number.m4a',
          initialization: null,
        },
        representations: [{
          id: '1',
          bandwidth: 129866,
        }],
        baseURL: null,
      }],
    }],
  },
};

const mpd2 = {
  text:
    `<?xml version="1.0"?>
    <MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static"
      minBufferTime="PT16.00S" mediaPresentationDuration="PT2M"
      maxSegmentDuration="errPT4S" profiles="urn:mpeg:dash:profile:full:2011">
    <ProgramInformation moreInformationURL="http://example.org/">
      <Title>Example MPD 2</Title>
    </ProgramInformation>
    <BaseURL>http://example.org/some/mpd</BaseURL>
    <Period duration="PT2M">
      <AdaptationSet segmentAlignment="true" id="1" mimeType="audio/mp4"
        codecs="mp4a.40.2" audioSamplingRate="48000" value="5">
        <SegmentTemplate startNumber="1" presentationTimeOffset="0"
          timescale="48000" duration="96000" media="/1/segment_$Number.m4a" />
        <Representation id="1" bandwidth="129866" />
      </AdaptationSet>
    </Period>
    </MPD>`,
  json: {
    type: 'static',
    minBufferTime: 16,
    mediaPresentationDuration: 120,
    maxSegmentDuration: NaN,
    availabilityStartTime: null,
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
        mimeType: 'audio/mp4',
        value: 5,
        audioChannelConfiguration: null,
        segmentTemplate: {
          duration: 96000,
          timescale: 48000,
          startNumber: 1,
          presentationTimeOffset: 0,
          media: '/1/segment_$Number.m4a',
          initialization: null,
        },
        representations: [{
          id: '1',
          bandwidth: 129866,
        }],
        baseURL: null,
      }],
    }],
  },
};

export default [mpd1, mpd2];
