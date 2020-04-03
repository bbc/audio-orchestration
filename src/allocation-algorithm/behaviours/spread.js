const convertDecibelsToLinearGain = decibels => 10 ** (decibels / 20);

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

    // get the setting (in dB) and calculate the overall gain by applying the adjustment once per
    // device beyond the first one.
    const { perDeviceGainAdjust = 0.0 } = behaviourParameters;
    return {
      gain: convertDecibelsToLinearGain(perDeviceGainAdjust) ** (numDevices - 1),
    };
  },
});

export default spread;
