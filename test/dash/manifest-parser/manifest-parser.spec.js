import ManifestParser from './../../../src/dash/manifest-parser/manifest-parser';
import mockMpds from './../mpds';

describe('ManifestParser', function() {
  it('should correctly parse MPD files', function() {
    const manifestParser = new ManifestParser();
    const domParser = new DOMParser();

    mockMpds.forEach((mpd) => {
      const mpdXml = domParser.parseFromString(mpd.text, 'text/xml', 0);
      const mpdJson = manifestParser.parse(mpdXml);
      expect(mpdJson).toEqual(mpd.json);
    });
  });
});
