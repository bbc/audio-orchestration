import AllocationAlgorithm from './AllocationAlgorithm';
import onChange from './behaviours/onChange';
import spread from './behaviours/spread';
import exclusive from './behaviours/exclusive';
import mainDeviceOnly from './behaviours/mainDeviceOnly';
import auxDevicesOnly from './behaviours/auxDevicesOnly';
import {
  preferredIf,
  allowedIf,
  prohibitedIf,
} from './behaviours/conditionals';

class DefaultAllocationAlgorithm extends AllocationAlgorithm {
  constructor(options) {
    super(options);

    // onChange: options for managing changes between allocation algorithm runs
    this.registerBehaviour('onChange', onChange);

    // Spread: can be in multiple devices.
    this.registerBehaviour('spread', spread);

    // Exclusive: must be in a device by itself.
    this.registerBehaviour('exclusive', exclusive);

    // mainDeviceOnly
    this.registerBehaviour('mainDeviceOnly', mainDeviceOnly);

    // auxDevicesOnly
    this.registerBehaviour('auxDevicesOnly', auxDevicesOnly);

    // preferredIf (conditional)
    this.registerBehaviour('preferredIf', preferredIf);

    // allowedIf (conditional)
    this.registerBehaviour('allowedIf', allowedIf);

    // prohibitedIf (conditional)
    this.registerBehaviour('prohibitedIf', prohibitedIf);

    // Allowed on every device, mainly for testing
    this.registerBehaviour('allowedEverywhere', ({ devices }) => ({
      allowed: devices.map(({ deviceId }) => deviceId),
    }));
  }
}

export default DefaultAllocationAlgorithm;
