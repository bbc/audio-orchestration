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
    </ParentTemplate>`, 'text/xml', 0),
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

export default [ document1 ];
