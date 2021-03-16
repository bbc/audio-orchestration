import { convertDecibelsToLinearGain } from './gainCalculations';

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

    // Get the flags for different methods of making gain adjustments for multiple devices
    const {
      enableGainCompensation = false,
      perDeviceGainAdjust = 0.0, // in dB
    } = behaviourParameters;

    let gain = 1; // linear gain

    // If enableGainCompensation is set:
    // Assume summing incoherent sources and reduce level of object in each device accordingly
    if (enableGainCompensation) {
      gain *= convertDecibelsToLinearGain(0 - (10 * Math.log10(numDevices)));
    }

    // Add an extra gain adjustment for each connected device (perDeviceGainAdjust)
    if (perDeviceGainAdjust) {
      gain *= (convertDecibelsToLinearGain(perDeviceGainAdjust) ** (numDevices - 1));
    }

    return { gain };
  },
});

export default spread;
