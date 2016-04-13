// A set of datamodels that represent the constituent components of the
// ISO/IEC 23009 -- Dynamic adaptive streaming over HTTP (DASH) specification.

const MPD = {
  attributes: [{
    name: 'type',
    type: 'string',
    default: 'static',
  }, {
    name: 'minBufferTime',
    type: 'period',
  }, {
    name: 'mediaPresentationDuration',
    type: 'period',
  }, {
    name: 'maxSegmentDuration',
    type: 'period',
  }],
  nodes: [{
    name: 'programInformation',
    node: 'ProgramInformation',
    type: 'ProgramInformation',
    mapping: 'one',
  }, {
    name: 'baseURL',
    node: 'BaseURL',
    type: 'string',
    mapping: 'many',
  }, {
    name: 'periods',
    node: 'Period',
    type: 'Period',
    mapping: 'many',
  }],
};

const ProgramInformation = {
  attributes: [{
    name: 'moreInformationURL',
    type: 'string',
  }, {
    name: 'lang',
    type: 'string',
  }],
  nodes: [{
    name: 'title',
    node: 'Title',
    type: 'string',
    mapping: 'one',
  }, {
    name: 'source',
    node: 'Source',
    type: 'string',
    mapping: 'one',
  }, {
    name: 'copyright',
    node: 'Copyright',
    type: 'string',
    mapping: 'one',
  }],
};

const Period = {
  attributes: [{
    name: 'id',
    type: 'integer',
    default: 0,
  }, {
    name: 'duration',
    type: 'period',
    default: 0,
  }, {
    name: 'start',
    type: 'integer',
    default: 0,
  }],
  nodes: [{
    name: 'baseUrl',
    node: 'BaseUrl',
    type: 'string',
    mapping: 'one',
  }, {
    name: 'adaptationSets',
    node: 'AdaptationSet',
    type: 'AdaptationSet',
    mapping: 'many',
  }],
};

const AdaptationSet = {
  attributes: [{
    name: 'id',
    type: 'string',
  }, {
    name: 'mimeType',
    type: 'string',
  }, {
    // TODO: Sort this out.
    name: 'value',
    type: 'integer',
  }],
  nodes: [{
    name: 'segmentTemplate',
    node: 'SegmentTemplate',
    type: 'SegmentTemplate',
    mapping: 'one',
  }, {
    name: 'representations',
    node: 'Representation',
    type: 'Representation',
    mapping: 'many',
  }],
};

const SegmentTemplate = {
  attributes: [{
    name: 'duration',
    type: 'integer',
    default: 0,
  }, {
    name: 'timescale',
    type: 'integer',
    // TODO: Set this.
    default: 0,
  }, {
    name: 'startNumber',
    type: 'integer',
    default: 1,
  }, {
    name: 'presentationTimeOffset',
    type: 'integer',
    default: 0,
  }, {
    name: 'media',
    type: 'string',
  }],
};

const Representation = {
  attributes: [{
    name: 'id',
    type: 'integer',
    default: 0,
  }, {
    name: 'bandwidth',
    type: 'integer',
  }],
};

export default {
  MPD,
  ProgramInformation,
  Period,
  AdaptationSet,
  SegmentTemplate,
  Representation,
};
