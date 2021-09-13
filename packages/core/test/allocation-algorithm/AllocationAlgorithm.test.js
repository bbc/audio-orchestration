import AllocationAlgorithm from '../../src/allocation-algorithm/AllocationAlgorithm';

describe('AllocationAlgorithm', () => {
  it('exists', () => {
    expect(AllocationAlgorithm).toBeDefined();

    const a = new AllocationAlgorithm();
    expect(a).toBeDefined();
  });
});
