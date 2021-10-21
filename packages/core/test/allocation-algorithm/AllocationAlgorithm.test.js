import AllocationAlgorithm from '../../src/allocation/AllocationAlgorithm';

describe('AllocationAlgorithm', () => {
  it('exists', () => {
    expect(AllocationAlgorithm).toBeDefined();

    const a = new AllocationAlgorithm();
    expect(a).toBeDefined();
  });
});
