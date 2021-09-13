import 'jasmine-ajax';

import AudioLoader from './../../../src/core/loaders/audio-loader';
import MockAudioContext from './../../mock-audio-context';
import mockHttpResponses from './arraybuffer-http-responses';

describe('AudioLoader', () => {
  beforeAll(() => {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest('error').andError();
    mockHttpResponses.forEach((mockResponse) => {
      jasmine.Ajax
        .stubRequest(mockResponse.url)
        .andReturn(mockResponse.response);
    });
  });

  afterAll(() => {
    jasmine.Ajax.uninstall();
  });

  it('should construct', () => {
    const context = MockAudioContext.createAudioContext();
    const audioLoader = new AudioLoader(context);
    expect(audioLoader).toBeDefined();
  });

  it('should load a single file', (done) => {
    const context = MockAudioContext.createAudioContext();
    const audioLoader = new AudioLoader(context);
    const mockResponse = mockHttpResponses[0];

    audioLoader.load(mockResponse.url)
      .then((audioBuffer) => {
        // Check that the audio data has been decoded.
        expect(audioBuffer).toEqual(jasmine.any(AudioBuffer));
        done();
      })
      .catch((error) => done.fail(error));
  });

  it('should load multiple files', (done) => {
    const context = MockAudioContext.createAudioContext();
    const audioLoader = new AudioLoader(context);
    const mockResponses = mockHttpResponses.slice(0, 3);
    const mockResponsesUrls = mockResponses.map((mock) => mock.url);

    audioLoader.load(mockResponsesUrls)
      .then((audioBuffers) => {
        // Check that all audio data has been decoded.
        audioBuffers.forEach((audioBuffer) => {
          expect(audioBuffer).toEqual(jasmine.any(AudioBuffer));
        });
        done();
      })
      .catch((error) => done.fail(error));
  });

  it('should reject when file is not found', (done) => {
    const context = MockAudioContext.createAudioContext();
    const audioLoader = new AudioLoader(context);
    const mockResponse = mockHttpResponses[3];

    audioLoader.load(mockResponse.url)
      .then(() => done.fail('Should have thrown an error.'))
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });

  it('should reject when transport errors', (done) => {
    const context = MockAudioContext.createAudioContext();
    const audioLoader = new AudioLoader(context);

    audioLoader.load('error')
      .then(() => done.fail('Should have thrown an error.'))
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });
});
