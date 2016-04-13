import CompoundNode from './../../src/core/compound-node';

export default class MockCompoundNode extends CompoundNode {
  constructor(context, inputs, outputs) {
    super(context);

    for (let i = 0; i < inputs; i++) {
      const gainNode = this.context.createGain();
      this._inputs.push(gainNode);
    }

    for (let i = 0; i < outputs; i++) {
      const gainNode = this.context.createGain();
      this._outputs.push(gainNode);
    }
  }
}
