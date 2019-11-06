import DefaultAllocationAlgorithm from '../../src/allocation-algorithm/DefaultAllocationAlgorithm';
import registerSchemaValidationMatcher from './helpers/registerSchemaValidationMatcher';
import registerAllocationValidationMatchers from './helpers/registerAllocationValidationMatchers';
// import generateDevices from './helpers/generateDevices';
// import wrapAllocate from './helpers/wrapAllocate';

registerSchemaValidationMatcher();
registerAllocationValidationMatchers();

describe('DefaultAllocationAlgorithm', () => {
  it('is a class', () => {
    expect(DefaultAllocationAlgorithm).toBeDefined();

    const a = new DefaultAllocationAlgorithm();
    expect(a).toBeDefined();
  });

  it('produces a valid allocation object for empty input', () => {
    const objects = [];
    const devices = [];

    // do this automatically on any call to allocate, maybe using a mock function/spy?
    expect(objects).toMatchSchema('objects');
    expect(devices).toMatchSchema('devices');

    const algorithm = new DefaultAllocationAlgorithm();
    const { allocations } = algorithm.allocate({ objects, devices });
    expect(allocations).toMatchSchema('allocations');
  });
});
