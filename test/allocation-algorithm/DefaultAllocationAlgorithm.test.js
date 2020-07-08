import DefaultAllocationAlgorithm from '../../src/allocation-algorithm/DefaultAllocationAlgorithm';
import registerSchemaValidationMatcher from './helpers/registerSchemaValidationMatcher';
import registerAllocationValidationMatchers from './helpers/registerAllocationValidationMatchers';
import generateDevices from './helpers/generateDevices';
import wrapAllocate from './helpers/wrapAllocate';

// First we have to register the custom matchers, before any of the tests, so we can use them later.
// These extend Jest's global `expect` method.
registerSchemaValidationMatcher();
registerAllocationValidationMatchers();

// Here we define the whole test suite describing the DefaultAllocationAlgorithm.
describe('DefaultAllocationAlgorithm', () => {
  // This is a basic test to make sure the class is defined and can be instantiated.
  it('is a class', () => {
    expect(DefaultAllocationAlgorithm).toBeDefined();

    const a = new DefaultAllocationAlgorithm();
    expect(a).toBeDefined();
  });

  // This is a basic test to ensure it works with valid but empty input. This test shows how we can
  // expect objects to match a specific schema without using wrapAllocate as in the later tests.
  it('produces a valid allocation object for empty input', () => {
    const objects = [];
    const devices = [];

    // do this automatically on any call to allocate, maybe using a mock function/spy?
    expect(objects).toMatchSchema('objects');
    expect(devices).toMatchSchema('devices');

    const algorithm = new DefaultAllocationAlgorithm();
    const { allocations } = algorithm.allocate({ objects, devices });
    expect(allocations).toMatchSchema('allocations');
  });

  // The first group of proper tests starts here, this one checks behaviours to do with device
  // types.
  describe('A: Device Types', () => {
    // Usually, we can instantiate the algorithm once for the entire group, and wrap its allocate
    // method to automatically check that inputs and outputs conform to the JSON schema definitions.
    const a = new DefaultAllocationAlgorithm();
    const wrappedAllocate = wrapAllocate(a);

    // Each test should only test one thing and have a useful and unique identifying name.
    test('1 Object plays from main device only', () => {
      // We can generate device metadata using generateDevices; here the first device has a known
      // deviceId and the deviceIsMainFlag set, and the function adds 10 more auxiliary devices
      // with default deviceIds.
      const devices = generateDevices([
        { deviceId: 'device-main', deviceIsMain: true },
      ], 10);

      // The objects list has a single object that is allowed in every device, and prohibited in
      // all but the main device, using behaviours.
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'mainDeviceOnly' },
          ],
        },
      ];

      // We use wrappedAllocate to ensure we've got the right format for devices and objects, and
      // that the returned allocations have the right format too.
      const { allocations } = wrappedAllocate({ devices, objects });

      // Finally, we describe conditions we expect to be true for this test to pass: The object
      // must be in the main device (using the deviceId we defined before) and it should not be
      // in anyother device, so it must only be in one device total.
      expect(allocations).toHaveObjectInDevice('object-1', 'device-main');
      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
    });

    test('2 Object plays from 1 auxiliary device only', () => {
      const devices = generateDevices([
        { deviceId: 'device-main', deviceIsMain: true },
      ], 10);
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'auxDevicesOnly' },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ devices, objects });

      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-main');
      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
    });

    describe('3 Object plays from any device auxiliary or main', () => {
      // The algorithm will randomly choose one of the allowed devices. We can check that:
      // * it only goes into one device at a time;
      // * it goes into the main device if that is available; and
      // * it goes into an auxiliary device if that is available.
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
          ],
        },
      ];

      it('plays from only one device', () => {
        const devices = generateDevices([
          { deviceId: 'device-1', deviceIsMain: true },
          { deviceId: 'device-2' },
          { deviceId: 'device-3' },
        ]);

        const { allocations } = wrappedAllocate({ devices, objects });

        expect(allocations).toHaveObjectInNumDevices('object-1', 1);
      });

      it('plays from the main device if no other device is available', () => {
        const devices = generateDevices([
          { deviceId: 'device-1', deviceIsMain: true },
        ]);

        const { allocations } = wrappedAllocate({ devices, objects });

        expect(allocations).toHaveObjectInNumDevices('object-1', 1);
      });

      it('plays from an auxiliary if no other device is available', () => {
        const devices = generateDevices([
          { deviceId: 'device-1', deviceIsMain: false },
        ]);

        const { allocations } = wrappedAllocate({ devices, objects });

        expect(allocations).toHaveObjectInNumDevices('object-1', 1);
      });
    });

    test('4 Object plays only on a mobile device', () => {
      const devices = generateDevices([
        { deviceId: 'device-1', deviceType: undefined, deviceIsMain: true },
        { deviceId: 'device-2', deviceType: 'mobile' },
        { deviceId: 'device-3', deviceType: 'desktop' },
      ]);

      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'allowedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.deviceType', operator: 'equals', value: 'mobile' },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ devices, objects });

      expect(allocations).toHaveObjectInDevice('object-1', 'device-2');
      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
    });

    test('5 Object plays only on device that joined 3rd', () => {
      const devices = generateDevices([
        { deviceId: 'device-1', deviceIsMain: true },
        { deviceId: 'device-2' },
        { deviceId: 'device-3' },
        { deviceId: 'device-4' },
      ]);

      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'allowedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.deviceJoiningNumber', operator: 'equals', value: 3 },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ devices, objects });

      expect(allocations).toHaveObjectInDevice('object-1', 'device-3');
      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
    });

    test('6 Object plays only on device with joining number less than 4', () => {
      const devices = generateDevices([
        { deviceId: 'device-1', deviceJoiningNumber: 1 },
        { deviceId: 'device-2', deviceJoiningNumber: 2 },
        { deviceId: 'device-4', deviceJoiningNumber: 4 },
        { deviceId: 'device-5', deviceJoiningNumber: 5 },
      ], 0);

      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'spread' },
            {
              behaviourType: 'allowedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.deviceJoiningNumber', operator: 'lessThan', value: 4 },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ devices, objects });

      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-4');
      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-5');
      expect(allocations).toHaveObjectInNumDevices('object-1', 2);
    });

    describe('7 Object only plays when there are more than 3 devices', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            {
              behaviourType: 'prohibitedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'session.numDevices', operator: 'lessThanOrEqual', value: 3 },
                ],
              },
            },
          ],
        },
      ];

      test('it plays if there are enough devices', () => {
        const devices = generateDevices([], 4);
        const { allocations } = wrappedAllocate({ devices, objects, session: { numDevices: 4 } });
        expect(allocations).toHaveObjectInAnyDevice('object-1');
      });

      test('it plays if there are too few devices', () => {
        const devices = generateDevices([], 3);
        const { allocations } = wrappedAllocate({ devices, objects, session: { numDevices: 3 } });
        expect(allocations).not.toHaveObjectInAnyDevice('object-1');
      });
    });

    test('8 Object plays on every other joined device', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'spread' },
            {
              behaviourType: 'allowedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.deviceJoiningNumber', operator: 'moduloIsZero', value: 2 },
                ],
              },
            },
          ],
        },
      ];

      const devices = generateDevices([
        { deviceId: 'device-1' },
        { deviceId: 'device-2' },
        { deviceId: 'device-3' },
        { deviceId: 'device-4' },
        { deviceId: 'device-5' },
        { deviceId: 'device-6' },
      ]);

      // preferred in a non-main device, both a main and non-main device are available
      const { allocations } = wrappedAllocate({ devices, objects });

      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-1');
      expect(allocations).toHaveObjectInDevice('object-1', 'device-2');
      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-3');
      expect(allocations).toHaveObjectInDevice('object-1', 'device-4');
      expect(allocations).not.toHaveObjectInDevice('object-1', 'device-5');
      expect(allocations).toHaveObjectInDevice('object-1', 'device-6');
    });

    test('9 Object plays from a preferred device unless none are available', () => {
      // The object is allowed in any device, but preferred in a non-main device.
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            {
              behaviourType: 'preferredIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.deviceIsMain', operator: 'equals', value: false },
                ],
              },
            },
          ],
        },
      ];

      const devices = generateDevices([
        { deviceId: 'device-1', deviceIsMain: true },
        { deviceId: 'device-2' },
      ]);

      // preferred in a non-main device, both a main and non-main device are available
      const { allocations: allocations1 } = wrappedAllocate({ devices, objects });
      expect(allocations1).not.toHaveObjectInDevice('object-1', 'device-1');
      expect(allocations1).toHaveObjectInDevice('object-1', 'device-2');

      // preferred in a non-main device, but only the main device is available
      const { allocations: allocations2 } = wrappedAllocate({ devices: [devices[0]], objects });
      expect(allocations2).toHaveObjectInDevice('object-1', 'device-1');
    });
  });

  describe('B: Controls', () => {
    const a = new DefaultAllocationAlgorithm();
    const wrappedAllocate = wrapAllocate(a);

    const devices = generateDevices([
      '-',
      'X',
      'XY',
      'XYZ',
      'XZ',
      'Y',
      'YZ',
      'Z',
    ].map(deviceId => ({
      deviceId,
      deviceControls: [
        { controlId: 'control', controlValues: deviceId.split('') },
      ],
    })));

    test('1 Object plays only on devices with control value X', () => {
      const objects = [{
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
        ],
      }];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInDevice('object-1', 'X');
      expect(allocations).toHaveObjectInDevice('object-1', 'XY');
      expect(allocations).toHaveObjectInDevice('object-1', 'XZ');
      expect(allocations).toHaveObjectInDevice('object-1', 'XYZ');
      expect(allocations).toHaveObjectInNumDevices('object-1', 4);
    });

    test('2 Object plays only on devices with control value X or Y', () => {
      const objects = [{
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'Y' },
              ],
            },
          },
        ],
      }];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInDevice('object-1', 'X');
      expect(allocations).toHaveObjectInDevice('object-1', 'XY');
      expect(allocations).toHaveObjectInDevice('object-1', 'XZ');
      expect(allocations).toHaveObjectInDevice('object-1', 'XYZ');
      expect(allocations).toHaveObjectInDevice('object-1', 'Y');
      expect(allocations).toHaveObjectInDevice('object-1', 'YZ');
      expect(allocations).toHaveObjectInNumDevices('object-1', 6);
    });

    test('3 Object plays only on devices with control value including X and Y', () => {
      const objects = [{
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
                { property: 'deviceControls.control', operator: 'equals', value: 'Y' },
              ],
            },
          },
        ],
      }];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInDevice('object-1', 'XY');
      expect(allocations).toHaveObjectInDevice('object-1', 'XYZ');
      expect(allocations).toHaveObjectInNumDevices('object-1', 2);
    });

    test('4 Object plays only on devices with control value not including X', () => {
      const objects = [{
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                {
                  property: 'deviceControls.control', invertCondition: true, operator: 'equals', value: 'X',
                },
              ],
            },
          },
        ],
      }];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInDevice('object-1', '-');
      expect(allocations).toHaveObjectInDevice('object-1', 'Y');
      expect(allocations).toHaveObjectInDevice('object-1', 'YZ');
      expect(allocations).toHaveObjectInDevice('object-1', 'Z');
      expect(allocations).toHaveObjectInNumDevices('object-1', 4);
    });

    // TODO I think this would include all devices
    test.todo('5 Object plays only on devices with control value not including X or not including Y');

    test('6 Object plays only on devices without control value X and without control value Y', () => {
      const objects = [{
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedIf',
            behaviourParameters: {
              conditions: [
                {
                  property: 'deviceControls.control', invertCondition: true, operator: 'anyOf', value: ['X', 'Y'],
                },
              ],
            },
          },
        ],
      }];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInDevice('object-1', '-');
      expect(allocations).toHaveObjectInDevice('object-1', 'Z');
      expect(allocations).toHaveObjectInNumDevices('object-1', 2);
    });

    // TODO: there is no concept yet of a device having or not having a control (formerly known as
    // tag group)
    test.todo('7 Object plays only on devices with control A.');
    test.todo('8 Object plays only on devices without control A.');
  });

  describe('C: Object relations and object groups', () => {
    const a = new DefaultAllocationAlgorithm();
    const wrappedAllocate = wrapAllocate(a);

    const devices = generateDevices([
      { deviceId: 'device-1' },
      { deviceId: 'device-2' },
      { deviceId: 'device-3' },
    ]);

    test('1 Object plays exclusively', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'exclusive' },
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' },
          ],
        },
        {
          objectId: 'object-2',
          objectBehaviours: [
            { behaviourType: 'spread' },
            { behaviourType: 'allowedEverywhere' },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      // object-1 is exclusive and only allowed in the main device (device-1)
      expect(allocations).toHaveObjectInDevice('object-1', 'device-1');
      expect(allocations).toHaveObjectInNumDevices('object-1', 1);

      // object-2 is allowed everywhere and has the spread behaviour, it should be in every device
      // not taken by the exclusive object-1.
      expect(allocations).toHaveObjectInDevice('object-2', 'device-2');
      expect(allocations).toHaveObjectInDevice('object-2', 'device-3');
      expect(allocations).toHaveObjectInNumDevices('object-2', 2);
    });

    // TODO: we don't currently have conditions/operators that check metadata of other objects
    test.todo('2 Object only plays if no other object from group X is playing');
    test.todo('3 Object plays only if fewer than 2 other objects from group X are playing');

    test('4 Object does not play if a referenced object is playing in any device', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
          ],
        },
        {
          objectId: 'object-2',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            {
              behaviourType: 'prohibitedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'session.objectIds', operator: 'equals', value: 'object-1' },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      // Object 1 is allowed anywhere.
      expect(allocations).toHaveObjectInAnyDevice('object-1');
      // Object 2 is prohibited if object 1 is allocated.
      expect(allocations).not.toHaveObjectInAnyDevice('object-2');
    });

    test('5 Object plays if the referenced object is not playing', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [],
        },
        {
          objectId: 'object-2',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            {
              behaviourType: 'prohibitedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'session.objectIds', operator: 'equals', value: 'object-1' },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      // Object 1 is not allowed anywhere.
      expect(allocations).not.toHaveObjectInAnyDevice('object-1');
      // Object 2 is allowed everywhere, and only prohibited if object 1 is allocated.
      expect(allocations).toHaveObjectInAnyDevice('object-2');
    });

    test('6 Object only plays in devices where the referenced object is not playing', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' },
          ],
        },
        {
          objectId: 'object-2',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'spread' },
            {
              behaviourType: 'prohibitedIf',
              behaviourParameters: {
                conditions: [
                  { property: 'device.objectIds', operator: 'equals', value: 'object-1' },
                ],
              },
            },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      // Object 1 is not allowed in the main device only.
      expect(allocations).toHaveObjectInDevice('object-1', 'device-1');
      // Object 2 is allowed everywhere, spread, and prohibited from devices that object 1 is in.
      expect(allocations).toHaveObjectInNumDevices('object-2', devices.length - 1);
      expect(allocations).not.toHaveObjectInDevice('object-2', 'device-1');
    });
  });

  describe('D: Spread', () => {
    const a = new DefaultAllocationAlgorithm();
    const wrappedAllocate = wrapAllocate(a);

    const devices = generateDevices([
      { deviceId: 'device-1' },
      { deviceId: 'device-2' },
      { deviceId: 'device-3' },
    ]);

    test('1 Object can play in any number of devices', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'spread' },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInNumDevices('object-1', devices.length);
    });

    // TODO: this is not implemented yet and the parameter format may change.
    test.skip('2 Object can play in up to 2 devices', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'spread', behaviourParameters: { maxNumDevices: 2 } },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInNumDevices('object-1', devices.length);
    });

    test('3 Object can only play in 1 device', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
    });
  });

  describe('E: Mute if', () => {
    const a = new DefaultAllocationAlgorithm();
    const wrappedAllocate = wrapAllocate(a);

    const devices = generateDevices([
      { deviceId: 'device-1' },
    ]);

    test('1 Object is muted when referenced object is allocated', () => {
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
          ],
        },
        {
          objectId: 'object-2',
          objectBehaviours: [
            { behaviourType: 'allowedEverywhere' },
            { behaviourType: 'muteIf', behaviourParameters: { objectId: 'object-1' } },
          ],
        },
      ];

      const { allocations } = wrappedAllocate({ objects, devices });

      expect(allocations).toHaveObjectInNumDevices('object-1', 1);
      expect(allocations).toHaveObjectInNumDevices('object-2', 1);
      expect(allocations).toHaveObjectInDeviceWithGain('object-2', 'device-1', 0);
    });
  });
});
