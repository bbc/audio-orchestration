/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import AllocationAlgorithm from '../../src/allocation/AllocationAlgorithm';

describe('AllocationAlgorithm', () => {
  it('exists', () => {
    expect(AllocationAlgorithm).toBeDefined();

    const a = new AllocationAlgorithm();
    expect(a).toBeDefined();
  });
});
