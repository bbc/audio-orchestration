/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import CompoundNode from '../../src/core/compound-node';

// A super-simple minimum implementation of the CompoundNode interface.

export default class MockCompoundNode extends CompoundNode {
  constructor(context, inputs, outputs) {
    super(context);

    for (let i = 0; i < inputs; i += 1) {
      const gainNode = this.context.createGain();
      this._inputs.push(gainNode);
    }

    for (let i = 0; i < outputs; i += 1) {
      const gainNode = this.context.createGain();
      this._outputs.push(gainNode);
    }
  }
}
