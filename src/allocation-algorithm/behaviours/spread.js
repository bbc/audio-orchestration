const spread = ({ behaviourParameters, object, allocations }) => ({
  flags: ['spread'],
  postAllocationBehaviour: () => {
    // this is called for each device this object is assigned to once all objects are done.
    const { objectId } = object;

    // find the number of devices this object is assigned to
    let numDevices = 0;
    Object.values(allocations).forEach((deviceAllocations) => {
      if (deviceAllocations.find(a => a.objectId === objectId)) {
        numDevices += 1;
      }
    });

    // get the setting and calculate the desired new gain
    const { perDeviceGainAdjust = 1.0 } = behaviourParameters;
    return {
      gain: perDeviceGainAdjust ** (numDevices - 1),
    };
  },
});

export default spread;
