import 'jasmine-ajax';
import mockHttpResponses from './../../_mocks/mock-json-http-responses';
import Loader from './../../../src/core/loaders/loader';

describe('Loader', function() {
  beforeAll(function() {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest('error').andError();
    mockHttpResponses.forEach((mockResponse) => {
      jasmine.Ajax
        .stubRequest(mockResponse.url)
        .andReturn(mockResponse.response);
    });
  });

  afterAll(function() {
    jasmine.Ajax.uninstall();
  });

  it('should construct without responseType', function() {
    const loader = new Loader();
    expect(loader).toBeDefined();
  });

  it('should construct with responseType', function() {
    const loader = new Loader('json');
    expect(loader).toBeDefined();
  });

  it('should load a single file', function(done) {
    const loader = new Loader('json');
    const mockResponse = mockHttpResponses[0];

    loader.load(mockResponse.url)
      .then(function(file) {
        expect(file).toBe(mockResponse.response.response);
        done();
      })
      .catch(function() {
        done.fail('Should not have thrown an error.');
      });
  });

  it('should load multiple files', function(done) {
    const loader = new Loader('json');
    const mockResponses = mockHttpResponses.slice(0, 3);
    const mockResponsesUrls = mockResponses.map((mock) => mock.url);

    loader.load(mockResponsesUrls)
      .then(function(files) {
        for (let i = 0; i < mockResponses.length; i++) {
          expect(files[i]).toBe(mockResponses[i].response.response);
        }
        done();
      })
      .catch(function() {
        done.fail('Should not have thrown an error.');
      });
  });

  it('should reject when file is not found', function(done) {
    const loader = new Loader('json');
    const mockResponse = mockHttpResponses[3];

    loader.load(mockResponse.url)
      .then(function(file) {
        done.fail('Should have thrown an error.');
      })
      .catch(function(error) {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });

  it('should reject when transport errors', function(done) {
    const loader = new Loader('json');

    loader.load('error')
      .then(function(file) {
        done.fail('Should have thrown an error.');
      })
      .catch(function(error) {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });
});
