/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
  gainAdjustmentIf,
} from './behaviours/conditionals';
import muteIf from './behaviours/muteIf';

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

    // gainAdjustmentIf (conditional)
    this.registerBehaviour('gainAdjustmentIf', gainAdjustmentIf);

    // Allowed on every device, mainly for testing
    this.registerBehaviour('allowedEverywhere', ({ devices }) => ({
      allowed: devices.map(({ deviceId }) => deviceId),
    }));

    // muteIf: reduce gain if a specified other object has been allocated
    this.registerBehaviour('muteIf', muteIf);
  }
}

export default DefaultAllocationAlgorithm;
