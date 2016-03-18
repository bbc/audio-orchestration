import {
  Loader,
} from '../../core/_index';
import SegmentStream from './segment-stream';

export default class MetadataSegmentLoader extends SegmentStream {
  constructor(context, definition) {
    super(context, new Loader('json'), definition);
  }
}
