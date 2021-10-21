import DefaultAllocationAlgorithm from '../../src/allocation/DefaultAllocationAlgorithm';
import registerSchemaValidationMatcher from './helpers/registerSchemaValidationMatcher';
import registerAllocationValidationMatchers from './helpers/registerAllocationValidationMatchers';
import generateDevices from './helpers/generateDevices';
import wrapAllocate from './helpers/wrapAllocate';

// First we have to register the custom matchers, before any of the tests, so we can use them later.
// These extend Jest's global `expect` method.
registerSchemaValidationMatcher();
registerAllocationValidationMatchers();

/** Function for multiple allocation algorithm Runs
*/
const multipleAllocationRuns = ({
  devicesList,
  objectsList,
  wrappedAllocate,
}) => {
  const results = [];
  for (let i = 0; i < devicesList.length; i += 1) {
    results.push(wrappedAllocate({
      devices: devicesList[i],
      objects: objectsList[i],
      previousResults: results[i - 1] || {},
    }));
  }
  return results;
};

// Here we define the whole test suite describing the DefaultAllocationAlgorithm.
// Tests to do with change management
describe('E: Change management', () => {
  // Usually, we can instantiate the algorithm once for the entire group, and wrap its allocate
  // method to automatically check that inputs and outputs conform to the JSON schema definitions.
  const a = new DefaultAllocationAlgorithm();
  const wrappedAllocate = wrapAllocate(a);

  describe('Change management "start" parameter is empty', () => {
    // Generate devices
    const devices = generateDevices([
      { deviceId: 'd1', deviceIsMain: false },
      { deviceId: 'd2', deviceIsMain: true },
    ]);

    // Single object, main device only, start parameter is not defined
    // (Default will be that it gets set to 'canAlwaysStart')
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              allocate: [
                'moveToPreferred',
                'stayInPrevious',
                'moveToAllowedNotPrevious',
                'moveToAllowed',
              ],
            },
          },
          { behaviourType: 'mainDeviceOnly' },
          { behaviourType: 'allowedEverywhere' }, // Needed as main device isn't added otherwise
        ],
      },
    ];

    test('0 Object is always allowed to start', () => {
      // Run 1: No suitable device, object isn't played
      // Run 2: Suitable device, object is played
      // Run 3: No suitable device, object isn't played
      // Run 4: Suitable device, object is played
      const devicesList = [[devices[0]], [devices[1]], [devices[0]], [devices[1]]];
      const objectsList = [objects, objects, objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).not.toHaveObjectInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectInDevice('object-1', 'd2');
      expect(results[2].allocations).not.toHaveObjectInDevice('object-1', 'd1');
      expect(results[3].allocations).toHaveObjectInDevice('object-1', 'd2');
    });
  });

  describe('Change management "start" parameter', () => {
    // Generate devices
    const devices = generateDevices([
      { deviceId: 'd1', deviceIsMain: false },
      { deviceId: 'd2', deviceIsMain: true },
    ]);

    test('1 Object is always allowed to start (canAlwaysStart)', () => {
      // Single object, main device only, onChange behaviour to test (canAlwaysStart)
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'onChange',
              behaviourParameters: {
                start: 'canAlwaysStart',
                allocate: [
                  'moveToPreferred',
                  'stayInPrevious',
                  'moveToAllowedNotPrevious',
                  'moveToAllowed',
                ],
              },
            },
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' }, // Needed as main device isn't added otherwise
          ],
        },
      ];

      // Run 1: No suitable device, object isn't played
      // Run 2: Suitable device, object is played
      // Run 3: No suitable device, object isn't played
      // Run 4: Suitable device, object is played
      const devicesList = [[devices[0]], [devices[1]], [devices[0]], [devices[1]]];
      const objectsList = [objects, objects, objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).not.toHaveObjectInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectInDevice('object-1', 'd2');
      expect(results[2].allocations).not.toHaveObjectInDevice('object-1', 'd1');
      expect(results[3].allocations).toHaveObjectInDevice('object-1', 'd2');
    });

    test('2 Object is not allowed to restart (canNeverRestart)', () => {
      // Single object, main device only, onChange behaviour to test (canNeverRestart)
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'onChange',
              behaviourParameters: {
                start: 'canNeverRestart',
                allocate: [
                  'moveToPreferred',
                  'stayInPrevious',
                  'moveToAllowedNotPrevious',
                  'moveToAllowed',
                ],
              },
            },
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' }, // Needed as main device isn't added otherwise
          ],
        },
      ];

      // Run 1: suitable device exists, object is allocated
      // Run 2: no suitable device exists, object isn't allocated
      // Run 3: suitable device exists, object ins't allocated
      const devicesList = [[devices[1]], [devices[0]], [devices[1]]];
      const objectsList = [objects, objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectInDevice('object-1', 'd2');
      expect(results[1].allocations).not.toHaveObjectInAnyDevice('object-1');
      expect(results[2].allocations).not.toHaveObjectInAnyDevice('object-1');
    });

    test('3 Object can only start on the first run of the allocation algorithm in the sequence (canOnlyStartOnFirstRun) - no initial start', () => {
      // Single object, main device only, onChange behaviour to test (canNeverRestart)
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'onChange',
              behaviourParameters: {
                start: 'canOnlyStartOnFirstRun',
                allocate: [
                  'moveToPreferred',
                  'stayInPrevious',
                  'moveToAllowedNotPrevious',
                  'moveToAllowed',
                ],
              },
            },
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' }, // Needed as main device isn't added otherwise
          ],
        },
      ];

      // Run 1: No device available, object not allocated
      // Run 2: Allowed device available, object not allocated
      const devicesList = [[], [devices[1]]];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).not.toHaveObjectInAnyDevice('object-1');
      expect(results[1].allocations).not.toHaveObjectInAnyDevice('object-1');
    });

    test('4 Object can only start on the first run of the allocation algorithm in the sequence (canOnlyStartOnFirstRun) - no restart', () => {
      // Single object, main device only, onChange behaviour to test (canNeverRestart)
      const objects = [
        {
          objectId: 'object-1',
          objectBehaviours: [
            {
              behaviourType: 'onChange',
              behaviourParameters: {
                start: 'canOnlyStartOnFirstRun',
                allocate: [
                  'moveToPreferred',
                  'stayInPrevious',
                  'moveToAllowedNotPrevious',
                  'moveToAllowed',
                ],
              },
            },
            { behaviourType: 'mainDeviceOnly' },
            { behaviourType: 'allowedEverywhere' }, // Needed as main device isn't added otherwise
          ],
        },
      ];

      // Run 1: Device available, object should start
      // Run 2: No change, object should continue
      // Run 3: No device available for the object, object should stop
      // Run 4: Device available, object shouldn't restart
      const devicesList = [[devices[1]], [devices[1]], [devices[0]], [devices[1]]];
      const objectsList = [objects, objects, objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectInDevice('object-1', 'd2');
      expect(results[1].allocations).toHaveObjectInDevice('object-1', 'd2');
      expect(results[2].allocations).not.toHaveObjectInAnyDevice('object-1');
      expect(results[3].allocations).not.toHaveObjectInAnyDevice('object-1');
    });
  });

  describe('Change management "allocate" parameter, "moveToPreferred" option', () => {
    // Generate devices
    // d1: allowed
    // d2: preferred
    // d3: equally preferred
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
      {
        deviceId: 'd3',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToPreferred',
              ],
            },
          },
        ],
      },
    ];

    test('5 A more preferred device becomes available and the object moves to that device', () => {
      // Run 1: Suitable device; object is played
      // Run 2: Preferred device joins; object moves
      const devicesList = [
        [devices[0]],
        [devices[0], devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('6 A new, equally preferred device becomes available and the object stays where it is', () => {
      // Run 1: Preferred device; object is played
      // Run 2: New, equally preferred device joins; object doesn't move
      const devicesList = [
        [devices[1]],
        [devices[1], devices[2]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('7 The object is in a preferred device. There is a change and no preferred device is available. The object stops playing.', () => {
      // Run 1: Preferred device; object is played
      // Run 2: Only an allowed device is available; object stops playing
      const devicesList = [
        [devices[1]],
        [devices[0]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
      expect(results[1].allocations).not.toHaveObjectInDevice('object-1', 'd1');
    });

    test('8 The object is in an allowed device. There is a change, but still no preferred device is available. The object stops playing.', () => {
      // Run 1: Suitable device; object is played
      // Run 2: Only an allowed device is available; object stops playing
      const devicesList = [
        [devices[0]],
        [devices[0]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).not.toHaveObjectInDevice('object-1', 'd1');
    });
  });

  describe('Change management "allocate" parameter, "moveToPreferred" and "stayInPrevious" options', () => {
    // Generate devices (simulate change from preferred to allowed)
    // d1: preferred
    // d1: allowed
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToPreferred',
                'stayInPrevious',
              ],
            },
          },
        ],
      },
    ];

    test('9 A device tag changes so that the device changes from preferred to allowed, leaving no preferred devices; the object stays in the previous device', () => {
      // Run 1: Preferred device; object is played
      // Run 2: Preferred device not available; object stays in previous
      const devicesList = [
        [devices[0]],
        [devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
    });
  });

  describe('Change management "allocate" parameter, "stayInPrevious" option', () => {
    // Generate devices
    // d1: preferred
    // d2: allowed
    // d3: preferred
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
      {
        deviceId: 'd3',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'stayInPrevious',
              ],
            },
          },
        ],
      },
    ];

    test('10 A new, more preferred device becomes available and the object stays where it is', () => {
      // Run 1: Allowed device; object is played
      // Run 2: Preferred device becomes available; object stays in previous
      const devicesList = [
        [devices[1]],
        [devices[0], devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('11 A new, equally preferred device becomes available and the object stays where it is', () => {
      // Run 1: Preferred device; object is played
      // Run 2: New preferred device becomes available; object stays in previous
      const devicesList = [
        [devices[0]],
        [devices[0], devices[2]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
    });

    test('12 Previous device goes away but there is another allowed device; object is not allocated', () => {
      // Run 1: Object is in preferred device and there is another allowed device
      // Run 2: Preferred device goes away, allowed device stays, object is not allocated
      const devicesList = [
        [devices[0], devices[1]],
        [devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).not.toHaveObjectInAnyDevice('object-1');
    });
  });

  describe('Change management "allocate" parameter, "moveToAllowedNotPrevious" option', () => {
    // Generate devices
    // d1: preferred
    // d2: allowed
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToAllowedNotPrevious',
              ],
            },
          },
        ],
      },
    ];

    test('13 A change occurs, the object must move. The object moves to a different device', () => {
      // Run 1: Preferred and allowed device; object is played in preferred
      // Run 2: Preferred and allowed device; object moves to allowed device
      const devicesList = [
        devices,
        devices,
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('14 A change occurs, the object must move. No other device is available, so the object stops playing', () => {
      // Run 1: Preferred device; object is played
      // Run 2: No new device becomes available; object stops
      const devicesList = [
        [devices[0]],
        [devices[0]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectInNumDevices('object-1', 0);
    });
  });

  describe('Change management "allocate" parameter, "moveToAllowed" option', () => {
    // Generate devices
    // d1: allowed
    // d2: allowed
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToAllowed',
              ],
            },
          },
        ],
      },
    ];

    test('15 A change occurs but no new devices are available; the object stays in its previous device', () => {
      // Run 1: Allowed device; object is played
      // Run 2: Same allowed device; object either stays
      const devicesList = [
        [devices[0]],
        [devices[0]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
    });

    test('16 A change occurs and only a new allowed device is available; the object moves to the new device', () => {
      // Run 1: Allowed device; object is played
      // Run 2: Different allowed device; object moves to new device
      const devicesList = [
        [devices[0]],
        [devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('17 Many changes occur; the object is always allocated (should be random; warn if any device is never used)', () => {
      // TODO: Review this testing approach
      // Many runs with two allowed devices
      // Check that the object is always assigned
      // Warn if it's always allocated to the same device
      const numTests = 100;

      const devicesList = [];
      const objectsList = [];

      for (let i = 0; i < numTests; i += 1) {
        devicesList.push(devices);
        objectsList.push(objects);
      }

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      let numTimesD1Used = 0;
      let numTimesD2Used = 0;

      for (let i = 0; i < numTests; i += 1) {
        if (results[i].allocations.d1.length > 0) {
          numTimesD1Used += 1;
        }
        if (results[i].allocations.d2.length > 0) {
          numTimesD2Used += 1;
        }

        expect(results[i].allocations).toHaveObjectInNumDevices('object-1', 1);
      }

      if (numTimesD1Used === 0 || numTimesD2Used === 0) {
        console.warn('One of the devices was never used. This could happen by chance, but may need to be checked.');
      }
    });
  });

  describe('Change management "allocate" parameter, "moveToAllowedNotPrevious" and "moveToAllowed" options', () => {
    // Generate devices
    // d1: allowed
    // d2: allowed
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToAllowedNotPrevious',
                'moveToAllowed',
              ],
            },
          },
        ],
      },
    ];

    test('18 A change occurs but no new devices are available; the object stays in its previous device', () => {
      // Run 1: Allowed device; object is allocated
      // Run 2: Same allowed device; object is still allocated
      const devicesList = [
        [devices[0]],
        [devices[0]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
    });
  });

  describe('Change management "allocate" parameter is empty', () => {
    // If an onChange behaviour is applied with empty allocate parameter, then
    // all devices will be added to the prohibited list, so the object will not be allocated.
    // Different to not applying onChange at all, where lists are just populated by behaviours

    // Generate devices
    // d1: allowed
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [],
            },
          },
        ],
      },
    ];

    test('19 A change occurs and the object is not allocated', () => {
      // Run 1: Allowed device; object is allocated
      // Run 2: Same allowed device; object is not allocated
      const devicesList = [
        devices,
        devices,
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).not.toHaveObjectInDevice('object-1', 'd1');
    });
  });

  describe('Change management for a spread object', () => {
    // Generate three allowed devices
    const devices = generateDevices([
      { deviceId: 'device-1' },
      { deviceId: 'device-2' },
      { deviceId: 'device-3' },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [
                'moveToPreferred',
                'stayInPrevious',
                'moveToAllowedNotPrevious',
                'moveToAllowed',
              ],
            },
          },
        ],
      },
      {
        objectId: 'object-2',
        objectBehaviours: [
          { behaviourType: 'spread' },
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'onChange',
            behaviourParameters: {
              start: 'canAlwaysStart',
              allocate: [],
            },
          },
        ],
      },
    ];

    test('20 A change occurs and the spread object (with onChange behaviour) is allocated to all available allowed devices', () => {
      // Run 1: Object is spread into two devices
      // Run 2: One drops out and a new one joins, object is spread into two devices
      const devicesList = [
        [devices[0], devices[1]],
        [devices[1], devices[2]],
      ];
      const objectsList = [[objects[0]], [objects[0]]];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectInNumDevices('object-1', 2);
      expect(results[1].allocations).toHaveObjectInNumDevices('object-1', 2);
    });

    test('21 A change occurs and the spread object (with onChange behaviour but no allocate options) is allocated to all available allowed devices', () => {
      // Run 1: Object is spread into two devices
      // Run 2: One drops out and a new one joins, object is spread into two devices
      const devicesList = [
        [devices[0], devices[1]],
        [devices[1], devices[2]],
      ];
      const objectsList = [[objects[1]], [objects[1]]];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectInNumDevices('object-2', 2);
      expect(results[1].allocations).toHaveObjectInNumDevices('object-2', 2);
    });
  });

  describe('No change management behaviour is applied', () => {
    // Generate devices
    // d1: allowed
    // d2: preferred
    // d3: preferred
    const devices = generateDevices([
      {
        deviceId: 'd1',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['Y'] },
        ],
      },
      {
        deviceId: 'd2',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
      {
        deviceId: 'd3',
        deviceIsMain: false,
        deviceControls:
        [
          { controlId: 'control', controlValues: ['X'] },
        ],
      },
    ]);

    // Generate objects
    const objects = [
      {
        objectId: 'object-1',
        objectBehaviours: [
          {
            behaviourType: 'allowedEverywhere',
          },
          {
            behaviourType: 'preferredIf',
            behaviourParameters: {
              conditions: [
                { property: 'deviceControls.control', operator: 'equals', value: 'X' },
              ],
            },
          },
        ],
      },
    ];

    test('22 A more preferred device becomes available and the object moves to that device', () => {
      // Run 1: Allowed device; object is allocated
      // Run 2: Preferred device joins; object moves to that device
      const devicesList = [
        [devices[0]],
        [devices[0], devices[1]],
      ];
      const objectsList = [objects, objects];

      const results = multipleAllocationRuns({
        devicesList,
        objectsList,
        wrappedAllocate,
      });

      expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
      expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    });

    test('23 An equally preferred device becomes available and the object is always allocated (should be random; warn if a device is not used)', () => {
      // TODO: Review this testing approach
      // Many runs; on each run:
      // Start with preferred
      // Add a preferred
      // Check that the object is allocated
      // Store the device that's used
      // Afterwards, warn if one device was never used
      const numTests = 100;

      const devicesList = [
        [devices[1]],
        [devices[1], devices[2]],
      ];
      const objectsList = [objects, objects];

      let numTimesD2Used = 0;
      let numTimesD3Used = 0;

      for (let i = 0; i < numTests; i += 1) {
        const results = multipleAllocationRuns({
          devicesList,
          objectsList,
          wrappedAllocate,
        });

        expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
        expect(results[1].allocations).toHaveObjectInNumDevices('object-1', 1);

        if (results[1].allocations.d2.length > 0) {
          numTimesD2Used += 1;
        }
        if (results[1].allocations.d3.length > 0) {
          numTimesD3Used += 1;
        }
      }

      if (numTimesD2Used === 0 || numTimesD3Used === 0) {
        console.warn('One of the devices was never used. This could happen by chance, but may need to be checked.');
      }
    });
  });
});
