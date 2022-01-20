/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import 'jasmine-ajax';
import mockHttpResponses from './mpd-http-responses';
import ManifestLoader from '../../../src/dash/manifest-loader/manifest-loader';

describe('ManifestLoader', () => {
  beforeAll(() => {
    // Set up the XMLHttpRequest mocking framework. Register request URLs and
    // the response that should be returned for each.
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

  it('should load a single file', (done) => {
    const manifestLoader = new ManifestLoader();
    const mockResponse = mockHttpResponses[0];

    manifestLoader.load(mockResponse.url)
      .then((file) => {
        // Check that MPD data has made it into the file.
        expect(file).toBeDefined();
        expect(file.childNodes).toBeDefined();
        expect(file.childNodes.length).toBe(1);
        expect(file.childNodes[0].nodeName).toBe('MPD');
        done();
      })
      .catch((error) => { done.fail(error); });
  });

  it('should load multiple files', (done) => {
    const manifestLoader = new ManifestLoader();
    const mockResponses = mockHttpResponses.slice(0, 2);
    const mockResponsesUrls = mockResponses.map((mock) => mock.url);

    manifestLoader.load(mockResponsesUrls)
      .then((files) => {
        // Check that each file returned is an XMLDocument.
        for (let i = 0; i < mockResponses.length; i += 1) {
          expect(files[i]).toBeDefined();
          expect(files[i].childNodes).toBeDefined();
        }
        done();
      })
      .catch((error) => { done.fail(error); });
  });

  it('should reject when file is not found', (done) => {
    const manifestLoader = new ManifestLoader();
    const mockResponse = mockHttpResponses[2];

    manifestLoader.load(mockResponse.url)
      .then(() => { done.fail('Should have rejected/thrown.'); })
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });

  it('should reject when transport errors', (done) => {
    const manifestLoader = new ManifestLoader();

    manifestLoader.load('error')
      .then(() => { done.fail('Should have rejected/thrown.'); })
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });
});
