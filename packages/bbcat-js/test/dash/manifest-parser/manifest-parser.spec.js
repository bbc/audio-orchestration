/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import ManifestParser from '../../../src/dash/manifest-parser/manifest-parser';
import mockMpds from '../mpds';

describe('ManifestParser', () => {
  it('should correctly parse MPD files', () => {
    const manifestParser = new ManifestParser();
    const domParser = new DOMParser();

    mockMpds.forEach((mpd) => {
      const mpdXml = domParser.parseFromString(mpd.text, 'text/xml');
      const mpdJson = manifestParser.parse(mpdXml);

      expect(mpdJson).toEqual(mpd.json);
    });
  });
});
