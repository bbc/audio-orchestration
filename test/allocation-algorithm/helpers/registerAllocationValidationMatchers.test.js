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

  describe('toHaveObjectInDeviceWithGain', () => {
    const expectedGain = 0.667;
    const allocations = {
      'device-1': [{ objectId: 'object-1', gain: expectedGain }],
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
});
