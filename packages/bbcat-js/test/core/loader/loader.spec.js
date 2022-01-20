/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import 'jasmine-ajax';

import Loader from '../../../src/core/loaders/loader';
import mockHttpResponses from './json-http-responses';

describe('Loader', () => {
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

  it('should construct without responseType', () => {
    const loader = new Loader();

    expect(loader).toBeDefined();
  });

  it('should construct with responseType', () => {
    const loader = new Loader('json');

    expect(loader).toBeDefined();
  });

  it('should load a single file', (done) => {
    const loader = new Loader('json');
    const mockResponse = mockHttpResponses[0];

    loader.load(mockResponse.url)
      .then((file) => {
        expect(file).toBe(mockResponse.response.response);
        done();
      })
      .catch((error) => done.fail(error));
  });

  it('should load multiple files', (done) => {
    const loader = new Loader('json');
    const mockResponses = mockHttpResponses.slice(0, 3);
    const mockResponsesUrls = mockResponses.map((mock) => mock.url);

    loader.load(mockResponsesUrls)
      .then((files) => {
        for (let i = 0; i < mockResponses.length; i += 1) {
          expect(files[i]).toBe(mockResponses[i].response.response);
        }
        done();
      })
      .catch((error) => done.fail(error));
  });

  it('should reject when file is not found', (done) => {
    const loader = new Loader('json');
    const mockResponse = mockHttpResponses[3];

    loader.load(mockResponse.url)
      .then(() => done.fail('Should have thrown an error.'))
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });

  it('should reject when transport errors', (done) => {
    const loader = new Loader('json');

    loader.load('error')
      .then(() => done.fail('Should have thrown an error.'))
      .catch((error) => {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });
});
