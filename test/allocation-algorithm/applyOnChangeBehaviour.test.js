import DefaultAllocationAlgorithm from '../../src/allocation-algorithm/DefaultAllocationAlgorithm';
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

  test('1 Object is always allowed to start (canAlwaysStart)', () => {
    // Generate devices
    const devices = generateDevices([
      { deviceId: 'd1', deviceIsMain: false },
      { deviceId: 'd2', deviceIsMain: true },
    ]);

    // Single object, main device only, onChange behaviour to test
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
    // Generate a main device and an aux device
    const devices = generateDevices([
      { deviceId: 'd1', deviceIsMain: true },
      { deviceId: 'd2', deviceIsMain: false },
    ]);

    // Single object, main device only, onChange behaviour to test
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
    const devicesList = [[devices[0]], [devices[1]], [devices[0]]];
    const objectsList = [objects, objects, objects];

    const results = multipleAllocationRuns({
      devicesList,
      objectsList,
      wrappedAllocate,
    });

    expect(results[0].allocations).toHaveObjectInDevice('object-1', 'd1');
    expect(results[1].allocations).not.toHaveObjectInDevice('object-1', 'd2');
    expect(results[2].allocations).not.toHaveObjectInDevice('object-1', 'd1');
  });

  test('3 Object can only start on the first run of the allocation algorithm in the sequence (canOnlyStartOnFirstRun)', () => {
    // Setup devices and objects
    const devices = generateDevices([
      { deviceId: 'd1', deviceIsMain: true },
      { deviceId: 'd2', deviceIsMain: false },
    ]);

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

    const devicesList = [[devices[0]], [devices[0]], [devices[1]], [devices[0]]];
    const objectsList = [objects, objects, objects, objects];

    const results = multipleAllocationRuns({
      devicesList,
      objectsList,
      wrappedAllocate,
    });

    expect(results[0].allocations).toHaveObjectInDevice('object-1', 'd1');
    expect(results[1].allocations).toHaveObjectInDevice('object-1', 'd1');
    expect(results[2].allocations).not.toHaveObjectInDevice('object-1', 'd2');
    expect(results[3].allocations).not.toHaveObjectInDevice('object-1', 'd1');
  });

  // TODO: Put all the moveToPreferred tests into a describe block, separate tests
  test('4 moveToPreferred only', () => {
    // A more preferred device becomes available and the object moves to that device.
    // A new, equally preferred device becomes available and the object stays where it is.
    // Devices change so that no preferred device is available,
    // although allowed devices are available; the object stops playing.

    // Generate devices
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

    // Single object, main device only, onChange behaviour to test
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

    // Run 1: Suitable device; object is played
    // Run 2: Preferred device joins; object moves
    // Run 3: New, equally preferred device joins; object doesn't move
    // Run 4: Only an allowed device is available; object stops playing
    const devicesList = [
      [devices[0]],
      [devices[0], devices[1]],
      devices,
      [devices[0]],
    ];
    const objectsList = [objects, objects, objects, objects];

    const results = multipleAllocationRuns({
      devicesList,
      objectsList,
      wrappedAllocate,
    });

    expect(results[0].allocations).toHaveObjectOnlyInDevice('object-1', 'd1');
    expect(results[1].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    expect(results[2].allocations).toHaveObjectOnlyInDevice('object-1', 'd2');
    expect(results[3].allocations).toHaveObjectInNumDevices('object-1', 0);
  });
});
