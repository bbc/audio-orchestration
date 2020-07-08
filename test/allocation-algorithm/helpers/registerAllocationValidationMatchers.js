const registerAllocationValidationMatchers = () => {
  // Check if object is in at least one device
  expect.extend({
    toHaveObjectInAnyDevice(allocations, objectId) {
      // Test that at least one objectInDevice, in at least one allocation, has the given objectId,
      const pass = Object.values(allocations)
        .some(allocation => allocation
          .some(objectInDevice => objectInDevice.objectId === objectId));

      if (pass) {
        return {
          message: () => `Expected object ${objectId} not to be in any device`,
          pass: true,
        };
      }
      return {
        message: () => `Expected object ${objectId} to be in at least one device`,
        pass: false,
      };
    },
  });

  // Check if object is in specified device
  expect.extend({
    toHaveObjectInDevice(allocations, objectId, deviceId) {
      const pass = allocations[deviceId]
        && allocations[deviceId].some(objectInDevice => objectInDevice.objectId === objectId);

      if (pass) {
        return {
          message: () => `Expected object ${objectId} not to be in device ${deviceId}` +
            '\n\n' +
            `Allocations: ${this.utils.printReceived(allocations)}`,
          pass: true,
        };
      }
      return {
        message: () => `Expected object ${objectId} to be in device ${deviceId}.` +
          '\n\n' +
          `Allocations: ${this.utils.printReceived(allocations)}`,
        pass: false,
      };
    },
  });

  // Check if object is in specified device and only that device
  expect.extend({
    toHaveObjectOnlyInDevice(allocations, objectId, deviceId) {
      const allocationsWithObject = Object.values(allocations)
        .filter(allocation => allocation.some(a => a.objectId === objectId));
      const actualNumDevices = allocationsWithObject.length;

      const pass = allocations[deviceId]
        && allocations[deviceId].some(objectInDevice => objectInDevice.objectId === objectId)
        && actualNumDevices === 1;

      if (pass) {
        return {
          message: () => `Expected object ${objectId} not to be in device ${deviceId} or not to be in multiple devices` +
            '\n\n' +
            `Allocations: ${this.utils.printReceived(allocations)}`,
          pass: true,
        };
      }
      return {
        message: () => `Expected object ${objectId} to be in device ${deviceId} only.` +
          '\n\n' +
          `Allocations: ${this.utils.printReceived(allocations)}`,
        pass: false,
      };
    },
  });

  // Check if the object is in a specified device with a specified gain
  expect.extend({
    toHaveObjectInDeviceWithGain(allocations, objectId, deviceId, gain) {
      const objectsInDevice = allocations[deviceId] || [];
      const objectInDevice = objectsInDevice.find(o => o.objectId === objectId);
      const actualGain = (objectInDevice || {}).objectGain;

      const delta = 1.0e-3;
      const pass = objectInDevice && actualGain < gain + delta && actualGain > gain - delta;

      if (pass) {
        return {
          message: () => `Expected object ${objectId} not to be in device ${deviceId}, or to have a different gain than ${gain}`,
          pass: true,
        };
      }
      return {
        message: () => `Expected object ${objectId} to be in device ${deviceId} with gain ${gain}, got ${actualGain}`,
        pass: false,
      };
    },
  });

  // Check if object is in a specific number of devices
  expect.extend({
    toHaveObjectInNumDevices(allocations, objectId, numDevices) {
      const allocationsWithObject = Object.values(allocations)
        .filter(allocation => allocation.some(a => a.objectId === objectId));
      const actualNumDevices = allocationsWithObject.length;
      const pass = actualNumDevices === numDevices;

      if (pass) {
        return {
          message: () => `Expected object ${objectId} not to be in exactly ${numDevices} devices`,
          pass: true,
        };
      }
      return {
        message: () => `Expected object ${objectId} to be in exactly ${numDevices} devices, but got ${actualNumDevices}`,
        pass: false,
      };
    },
  });
};

export default registerAllocationValidationMatchers;
