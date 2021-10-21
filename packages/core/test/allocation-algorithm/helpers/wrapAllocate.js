/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
const wrapAllocate = (algorithm) => (args = {}) => {
  // Check the input arguments
  expect(args.devices || []).toMatchSchema('devices');
  expect(args.objects || []).toMatchSchema('objects');
  expect(args.previousAllocations || {}).toMatchSchema('allocations');

  // Run the allocation
  const results = algorithm.allocate(args);

  // Check the results and return them
  expect(results.allocations).toMatchSchema('allocations');
  return results;
};

export default wrapAllocate;
