import 'jasmine-ajax';
import mockHttpResponses from './../../_mocks/mock-mpd-http-responses';
import ManifestLoader from './../../../src/dash/manifest-loader/manifest-loader';

describe('ManifestLoader', function() {
  beforeAll(function() {
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

  afterAll(function() {
    jasmine.Ajax.uninstall();
  });

  it('should load a single file', function(done) {
    const manifestLoader = new ManifestLoader();
    const mockResponse = mockHttpResponses[0];

    manifestLoader.load(mockResponse.url)
      .then(function(file) {
        // Check that MPD data has made it into the file.
        expect(file).toBeDefined();
        expect(file.childNodes).toBeDefined();
        expect(file.childNodes.length).toBe(1);
        expect(file.childNodes[0].nodeName).toBe('MPD');
        done();
      })
      .catch(function(error) {
        done.fail(error);
      });
  });

  it('should load multiple files', function(done) {
    const manifestLoader = new ManifestLoader();
    const mockResponses = mockHttpResponses.slice(0, 2);
    const mockResponsesUrls = mockResponses.map((mock) => mock.url);

    manifestLoader.load(mockResponsesUrls)
      .then(function(files) {
        // Check that each file returned is an XMLDocument.
        for (let i = 0; i < mockResponses.length; i++) {
          expect(files[i]).toBeDefined();
          expect(files[i].childNodes).toBeDefined();
        }
        done();
      })
      .catch(function(error) {
        done.fail(error);
      });
  });

  it('should reject when file is not found', function(done) {
    const manifestLoader = new ManifestLoader();
    const mockResponse = mockHttpResponses[2];

    manifestLoader.load(mockResponse.url)
      .then(function(file) {
        done.fail('Should have rejected/thrown.');
      })
      .catch(function(error) {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });

  it('should reject when transport errors', function(done) {
    const manifestLoader = new ManifestLoader();

    manifestLoader.load('error')
      .then(function(file) {
        done.fail('Should have rejected/thrown.');
      })
      .catch(function(error) {
        expect(error instanceof Error).toBeTruthy();
        done();
      });
  });
});
