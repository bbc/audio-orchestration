const exclusive = ({ allocations }) => {
  const prohibited = [];

  // prohibit any device that already has at least one object in it
  Object.entries(allocations).forEach(([deviceId, objects]) => {
    if (objects.length > 0) {
      prohibited.push(deviceId);
    }
  });

  // set the exclusive flag on the object, this will add hasExclusive to any selected device.
  return {
    flags: ['exclusive'],
    prohibited,
  };
};

export default exclusive;
