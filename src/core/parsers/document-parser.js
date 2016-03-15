export default class DocumentParser {
  constructor(models, parsers) {
    this._models = models || [];
    this._parsers = parsers || [];
  }

  // TODO: Consider adding sanity checks on document etc?
  parse(document) {
    // Grab the root element and corresponding model, and parse.
    const rootElement = document.childNodes[0];
    const rootModel = this._models[rootElement.nodeName];

    return this._parse(rootElement, rootModel);
  }

  _parse(node, model) {
    // Parses a node by iterating through the DOM tree. The model specifies all
    // attributes and nodes that should be parsed and how to do so.
    const attrModels = model.attributes || [];
    const nodeModels = model.nodes || [];
    const object = {};

    for (let i = 0; i < attrModels.length; i++) {
      const attrModel = attrModels[i];
      object[attrModel.name] = this._parseAttribute(node, attrModel);
    }

    for (let i = 0; i < nodeModels.length; i++) {
      const nodeModel = nodeModels[i];
      object[nodeModel.name] = this._parseNode(node, nodeModel);
    }

    return object;
  }

  _parseAttribute(node, attrModel) {
    // Parses a single attribute on the node as specified by the attrModel. If a
    // parser is found matching the specified type the value is parsed through
    // it. Otherwise; the value is returned.
    const value = node.getAttribute(attrModel.name) || attrModel.default;
    const parser = this._parsers[attrModel.type];

    return parser ? parser.call(null, value) : value;
  }

  _parseNode(node, nodeModel) {
    // Parses all children of the node as specified by the nodeModel.
    const name = nodeModel.node || nodeModel.name;
    const nodes = this._getChildNodes(node, name);

    if (nodes.length === 0) {
      return null;
    }

    return nodeModel.mapping === 'many' ?
      this._parseNodeMany(nodes, nodeModel) :
      this._parseNodeOne(nodes[0], nodeModel);
  }

  _parseNodeMany(nodes, nodeModel) {
    const childNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      childNodes.push(this._parseNodeOne(nodes[i], nodeModel));
    }

    return childNodes;
  }

  _parseNodeOne(node, nodeModel) {
    const model = this._models[nodeModel.type];

    return model ?
      this._parse(node, model) :
      this._flattenNodeToAttribute(node, nodeModel);
  }

  _flattenNodeToAttribute(node, nodeModel) {
    // Parses the text content of a node, flattening it to an atrribute.
    const value = node.textContent || nodeModel.default;
    const parser = this._parsers[nodeModel.type];

    return parser ? parser.call(null, value) : value;
  }

  _getChildNodes(node, name) {
    // Gets all child nodes with the same name that matches the name provided.
    const nodes = [];

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];
      const childName = childNode.nodeName;

      if (name.toLowerCase() === childName.toLowerCase()) {
        nodes.push(childNode);
      }
    }

    return nodes;
  }
}
