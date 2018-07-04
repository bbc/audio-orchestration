function allocate(objects, devices, previousAllocations = {}) {
  return {
    'device-0': [
      { objectNumber: 1, objectLabel: 'foo' },
      { objectNumber: 2, objectLabel: 'bar' },
    ],
    'device-1': [
      { objectNumber: 3, objectLabel: 'foo-bar' },
    ],
  };
}

export default allocate;
