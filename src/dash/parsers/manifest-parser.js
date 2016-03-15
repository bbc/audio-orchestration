import { DocumentParser } from '../../core/_index';

import models from './data-models/mpd-models';
import parsers from './data-models/mpd-parsers';

export default class ManifestParser extends DocumentParser {
  constructor(document) {
    super(models, parsers);
  }
}
