/**
 * A class to parse documents, returning Javascript objects representing their
 * contents. The structure and content of the returned objects is defined by a
 * set of datamodels and parsers that must be provided.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @example
 * // When document has the contents:
 * // <ParentTemplate id="0">
 * //   <ChildTemplate text="HelloWorld!"></ChildTemplate>
 * //   <ChildTemplate></ChildTemplate>
 * // </ParentTemplate>
 * //
 * // The result will contain the object:
 * // {
 * //   id: 0,
 * //   childTemplates: [{
 * //     text: 'HelloWorld!',
 * //   }, {
 * //     text: 'Default string.',
 * //   }],
 * // }
 *
 * const models = {
 *   ParentTemplate: {
 *     attributes: [{
 *     name: 'id',
 *       type: 'integer',
 *     }],
 *     nodes: [{
 *       name: 'childTemplates',
 *       node: 'ChildTemplate',
 *       type: 'ChildTemplate',
 *       mapping: 'many',
 *     }],
 *   },
 *   ChildTemplate: {
 *     attributes: [{
 *       name: 'text',
 *       type: 'string',
 *       default: 'Default string.',
 *     }],
 *   },
 * };
 *
 * const parsers = {
 *   integer: (value) => parseInt(value, 10),
 * }
 *
 * const documentParser = new DocumentParser(models, parsers);
 * const result = documentParser.parse(document);
 */
export default class DocumentParser {
  /**
   * Constructs a new {@link DocumentParser}.
   * @param  {!Object[]} models
   *         A set of data models that represent nodes within the documents to
   *         be parsed. See {@link DocumentParser} example for model structure.
   * @param  {?Object[]} parsers
   *         A set of parsers that convert strings to a desired type. See
   *         {@link DocumentParser} example for parser structure.
   */
  constructor(models, parsers = []) {
    this._models = models;
    this._parsers = parsers;
  }


  /**
   * Parses a document, returning an object representing the document contents.
   * @param  {!Document} document
   *         The document to parse.
   * @return {Object}
   *         The object representing the parsed document contents.
   */
  parse(document) {
    // TODO: Consider adding sanity checks on document etc?

    // Grab the root element and corresponding model, and parse.
    const rootElement = document.childNodes[0];
    const rootModel = this._models[rootElement.nodeName];

    return this._parse(rootElement, rootModel);
  }

  /**
   * Parses the node, by iterating through the nodes DOM tree. The model
   * specifies all attributes and child nodes that should be parsed and the
   * parser that should be used.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} model
   *         The model to parse the node against.
   * @return {Object}
   *         The object representing the parsed nodes contents.
   */
  _parse(node, model) {
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

  /**
   * Parses a single attribute on a node. The attrModel specifies the attribute
   * and how it should be parsed.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} attrModel
   *         The model to parse the attribute against.
   * @return {any}
   *         The parsed attribute.
   */
  _parseAttribute(node, attrModel) {
    // Parses a single attribute on the node as specified by the attrModel. If a
    // parser is found matching the specified type the value is parsed through
    // it. Otherwise; the value is returned.
    const value = node.getAttribute(attrModel.name) || attrModel.default;
    const parser = this._parsers[attrModel.type];

    return parser ? parser.call(null, value) : value;
  }

  /**
   * Parses all children of the node as specified by the nodeModel.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} nodeModel
   *         The model to parse the node against.
   * @return {any}
   *         The parsed node.
   */
  _parseNode(node, nodeModel) {
    const name = nodeModel.node || nodeModel.name;
    const nodes = this._getChildNodes(node, name);

    if (nodes.length === 0) {
      return null;
    }

    return nodeModel.mapping === 'many' ?
      this._parseNodeMany(nodes, nodeModel) :
      this._parseNodeOne(nodes[0], nodeModel);
  }

  /**
   * Parses all children of the node as specified by the nodeModel.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} nodeModel
   *         The model to parse the node against.
   * @return {any[]}
   *         The parsed node.
   */
  _parseNodeMany(nodes, nodeModel) {
    const childNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      childNodes.push(this._parseNodeOne(nodes[i], nodeModel));
    }

    return childNodes;
  }

  /**
   * Parses a single child of the node as specified by the nodeModel.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} nodeModel
   *         The model to parse the node against.
   * @return {any}
   *         The parsed node.
   */
  _parseNodeOne(node, nodeModel) {
    const model = this._models[nodeModel.type];

    return model ?
      this._parse(node, model) :
      this._flattenNodeToAttribute(node, nodeModel);
  }

  /**
   * Parses the text content of a node, flattening it to an atrribute.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!Object} nodeModel
   *         The model to parse the node against.
   * @return {any}
   *         The parsed attribute.
   */
  _flattenNodeToAttribute(node, nodeModel) {
    const value = node.textContent || nodeModel.default;
    const parser = this._parsers[nodeModel.type];

    return parser ? parser.call(null, value) : value;
  }

  /**
   * Gets all child nodes with the name equal to the name provided.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
   * @private
   * @param  {!Node} node
   *         The node to parse.
   * @param  {!string} name
   *         The name of the child node(s).
   * @return {Node[]}
   *         Array of nodes with the name equal to the name provided.
   */
  _getChildNodes(node, name) {
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
