// Exports a document and corresponding models, parsers and javascript object.
// document.models
//   - A set of models correspnding to the document contents.
// document.parsers
//   - A set of parsers correspnding to the document contents.
// document.document
//   - A string versions of a document.
// document.json
//   - Hand-transcribed Javascript-object representing document.
// document.jsonWithoutParsers
//   - Hand-transcribed Javascript-object representing document without
//     coverting any of the attribute values to formats other than string.

const parser = new DOMParser();

const document1 = {
  models: {
    ParentTemplate: {
      attributes: [{
        name: 'id',
        type: 'integer',
      }],
      nodes: [{
        name: 'childTemplates',
        node: 'ChildTemplate',
        type: 'ChildTemplate',
        mapping: 'many',
      }, {
        name: 'flattenFloat',
        node: 'FlattenFloat',
        type: 'float',
        mapping: 'one',
      }, {
        name: 'flattenText',
        node: 'FlattenText',
        default: 'Flat text.',
        mapping: 'one',
      }, {
        name: 'nullTest',
        mapping: 'one',
      }, {
        name: 'emptyChildTemplate',
        node: 'EmptyChildTemplate',
        type: 'EmptyChildTemplate',
        mapping: 'one',
      }],
    },
    ChildTemplate: {
      attributes: [{
        name: 'text',
        type: 'string',
        default: 'Default string.',
      }],
    },
    EmptyChildTemplate: { },
  },
  parsers: {
    integer: (value) => parseInt(value, 10),
    float: (value) => parseFloat(value),
  },
  document: parser.parseFromString(
    `<ParentTemplate id="0">
      <ChildTemplate text="HelloWorld!"></ChildTemplate>
      <ChildTemplate></ChildTemplate>
      <FlattenFloat>0.5</FlattenFloat>
      <FlattenText></FlattenText>
      <EmptyChildTemplate></EmptyChildTemplate>
    </ParentTemplate>`, 'text/xml',
  ),
  json: {
    id: 0,
    flattenFloat: 0.5,
    flattenText: 'Flat text.',
    nullTest: null,
    emptyChildTemplate: {},
    childTemplates: [{
      text: 'HelloWorld!',
    }, {
      text: 'Default string.',
    }],
  },
  jsonWithoutParsers: {
    id: '0',
    flattenFloat: '0.5',
    flattenText: 'Flat text.',
    nullTest: null,
    emptyChildTemplate: {},
    childTemplates: [{
      text: 'HelloWorld!',
    }, {
      text: 'Default string.',
    }],
  },
};

export default [document1];
