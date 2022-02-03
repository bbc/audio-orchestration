# Allocation Algorithm example

This example uses the `allocation-algorithm` components. It can be used to trace the steps the
algorithm takes to create the allocations for a given list of objects and devices.

## Usage

```
npm install
npm run dev
```

After running the development server (`npm run dev`), browse to [localhost:8080](http://localhost:8080).

Click _Re-run allocation_ to use data from the text boxes for object and device metadata (shown
with the _edit metadata_ button) to run an allocation. Then use the slider to go through the steps
the algorithm takes.

## Metadata format for allocation algorithm

The `AllocationAlgorithm` receives:

  * the `objects` metadata exactly as it was defined during production;
  * the `devices` metadata representing the current status of all devices, including the current control values for each;
  * the `session` metadata for global state not relating to a specific device; and
  * the `previousAllocations` mapping of devices to objects, from the previous run of the algorithm.

### Objects

```js
const objects = [
  {
    objectId: 'object-1',             // unique ID for this object, automatically generated
    objectName: 'The first object',   // human-readable name for this object
    objectLabels: [                   // custom labels applied to the object, may be used in behaviours
      'foreground',
      'dialogue',
    ],
    objectPan: 0.0,                   // (stereo) panning position between -1 (left) and +1 (right)
    objectGain: 1.0,                  // gain multiplier
    objectImage: 'object.jpg',        // application-specific reference to an image to show with this object
    objectBehaviours: [               // list of behaviours to apply to this object
      {
        behaviourType: 'allowedIf',   // the type determines which behaviour is run
        behaviourOptions: {           // options are defined by the behaviour implementation, they can contain any JSON object
          conditions: [
            {
              property: 'deviceControls.location',
              invertCondition: true,
              operator: 'anyOf',
              value: ['nearFront', 'farFront'],
            },
          ],
        },
      },
      {
        behaviourType: 'spread',      // Not all behaviours require options
      },
      {
        behaviourType: 'auxDevicesOnly',
      },
    ],
  },
];
```

### Devices

Any property of the `devices` may change, and devices may be added or removed, between calls to the allocation algorithm.

```js
const devices = [
  {
    deviceId: 'device-0',         // unique ID for this device, automatically generated
    deviceIsMain: true,           // whether it is the main device or an aux device
    deviceCategory: 'desktop',    // mobile, tablet, desktop, ...
    deviceJoiningNumber: 3,       // original position in joining order
    deviceCurrentNumber: 2,       // current position in joining order; different if a device left
    deviceLatency: 19,            // emission latency in milliseconds, if known for the device
    deviceGain: 1.0,              // calibration gain multiplier applied to every object on this device
    deviceControls: [             // an optional entry for every control
      {
        controlId: 'locationZone',    // unique identifier for the control
        controlValues: ['nearFront'], // list of values selected on this device; may be empty or contain a default value
      },
      {
        controlId: 'channelSelection',
        controlValues: ['commentator', 'home-crowd', 'away-crowd'],
      },
    ],
  },
];
```

### Session

The `session` object contains global metadata that represent the current state of the session, but are not specific to a single device.

```js
const session = {
  globalMaxLatency: 19,           // the highest deviceLatency of any device in the session
  globalNumDevices: 3,            // total number of devices currently connected (including main device)
};
```

### Allocations

The `previousAllocations` is an object in the same format as the `allocations` returned from the
algorithm. For each `deviceId` key it holds a list of objects representing the objects allocated
to that device by their `objectId` and a `gain` value.

```js
const allocations = {
  'device-1': [                 // the key is a unique deviceId
    {
      objectId: 'object-1',     // the unique objectId of an object assigned to this device
      gain: 1.0,                // the gain adjustment to apply when this object is played on this device
    },
    {
      objectId: 'object-2',
      gain: 0.7,
    },
  ],
  'device-2': [],
};
```
