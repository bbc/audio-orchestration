/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { DocumentParser } from '../../core/_index';

import models from './mpd-models';
import parsers from './mpd-parsers';

/**
 * A class to parse DASH Manifest documents, returning a Javascript object
 * representing their contents.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @extends {DocumentParser}
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('http://example.org/manifest.mpd').then((doc) => {
 *  const manifest = manifestParser.parse(doc);
 *  // Use manifest.mediaPresentationDuration etc.
 * });
 */
export default class ManifestParser extends DocumentParser {
  /**
   * Constructs a new {@link ManifestParser}.
   */
  constructor() {
    super(models, parsers);
  }
}
