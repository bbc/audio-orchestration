/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import registerAllocationValidationMatchers from './registerAllocationValidationMatchers';

registerAllocationValidationMatchers(expect);

describe('registerAllocationValidationMatchers', () => {
  describe('toHaveObjectInAnyDevice', () => {
    it('passes if object is in any device', () => {
      const allocations = {
        'device-1': [],
        'device-2': [{ objectId: 'object-1' }],
      };

      expect(allocations).toHaveObjectInAnyDevice('object-1');
    });

    it('fails if object is not in any device', () => {
      const allocations = {
        'device-1': [],
        'device-2': [],
      };

      expect(allocations).not.toHaveObjectInAnyDevice('object-1');
    });

    it('fails if there are no devices in given allocations', () => {
      expect({}).not.toHaveObjectInAnyDevice('object-1');
    });
  });

  describe('toHaveObjectInDevice', () => {
    const allocations = {
      'device-1': [{ objectId: 'object-1' }],
      'device-2': [],
    };

    it('passes if object is in a specific device', () => {
      expect(allocations).toHaveObjectInDevice('object-1', 'device-1');
    });

    it('fails if object is not in the specific device', () => {
      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-2');
    });
  });

  describe('toHaveObjectOnlyInDevice', () => {
    it('passes if object is only in a specific device', () => {
      const allocations = {
        'device-1': [{ objectId: 'object-1' }],
        'device-2': [],
      };

      expect(allocations).toHaveObjectOnlyInDevice('object-1', 'device-1');
    });

    it('fails if object is not in the specific device', () => {
      const allocations = {
        'device-1': [],
        'device-2': [{ objectId: 'object-1' }],
      };

      expect(allocations).not.toHaveObjectOnlyInDevice('object-1', 'device-1');
    });

    it('fails if object is in more than one device', () => {
      const allocations = {
        'device-1': [{ objectId: 'object-1' }],
        'device-2': [{ objectId: 'object-1' }],
      };

      expect(allocations).not.toHaveObjectOnlyInDevice('object-1', 'device-1');
    });
  });

  describe('toHaveObjectInDeviceWithGain', () => {
    const expectedGain = 0.667;
    const allocations = {
      'device-1': [{ objectId: 'object-1', objectGain: expectedGain }],
    };

    it('passes if object is in device with gain', () => {
      expect(allocations).toHaveObjectInDeviceWithGain('object-1', 'device-1', expectedGain);
    });

    it('passes if object is in device with very close gain', () => {
      expect(allocations).toHaveObjectInDeviceWithGain('object-1', 'device-1', expectedGain + 1.0e-6);
    });

    it('fails if object is not in device', () => {
      expect(allocations).not.toHaveObjectInDeviceWithGain('object-2', 'device-1', expectedGain);
    });

    it('fails if object is in device with different gain', () => {
      expect(allocations).not.toHaveObjectInDeviceWithGain('object-1', 'device-1', 0.5 * expectedGain);
    });
  });

  describe('toHaveObjectInNumDevices', () => {
    const allocations = {
      'device-1': [{ objectId: 'object-1' }],
      'device-2': [{ objectId: 'object-1' }],
      'device-3': [{ objectId: 'object-2' }],
    };

    it('passes if the object is in 2 devices as expected', () => {
      expect(allocations).toHaveObjectInNumDevices('object-1', 2);
    });

    it('fails if the object is fewer devices than expected', () => {
      expect(allocations).not.toHaveObjectInNumDevices('object-1', 3);
    });

    it('fails if the object is in more devices than expected', () => {
      expect(allocations).not.toHaveObjectInNumDevices('object-1', 1);
    });

    it('fails if the object is not in any device', () => {
      expect(allocations).not.toHaveObjectInNumDevices('object-1', 0);
    });

    it('passes if the object is in 0 devices as expected', () => {
      expect(allocations).toHaveObjectInNumDevices('object-3', 0);
    });
  });
});
