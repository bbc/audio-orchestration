import AllocationTrace from './AllocationTrace';
import applyOnChangeBehaviour from './applyOnChangeBehaviour';
import { setDifference, setUnion } from './setOperations';

/**
 * Represents the generic allocation algorithm. To be useful, it must be extended by registering
 * the behaviours referred to in the object metadata. See {@link DefaultAllocationAlgorithm} for
 * the implementation of the default behaviours.
 *
 * The algorithm itself is stateless; but the previous results can be passed into the
 * {@link allocate} method. Therefore the same instance can be used to allocate objects for
 * different sets of objects independently.
 *
 * @example
 * const a = new AllocationAlgorithm();
 * a.registerBehaviour('allowEverything', ({ devices }) => ({
 *   allowed: devices.map(d => d.deviceId),
 * });
 * const results = a.allocate({ objects, devices, session, previousResults });
 * console.log(results.allocations);
 */
class AllocationAlgorithm {
  /**
   * @param {Object} [options]
   * @param {Boolean} [options.saveSteps] - if set, {@link allocate} will additionally return a list
   * of steps tracing the algorithm execution.
   */
  constructor({
    saveSteps = false,
  } = {}) {
    this.saveSteps = saveSteps;
    this.behaviours = new Map();
  }

  /**
   * Registers (or replaces) a behaviour function to be run for objects that refer to it, during
   * the allocation.
   *
   * @param {String} type - a unique identifier for the behaviour, as used in object metadata.
   * @param {Function} fn - a function implementing the behaviour
   */
  registerBehaviour(type, fn) {
    this.behaviours.set(type, fn);
  }

  /**
   * Runs the allocation algorithm to create a new allocation map with an entry for each device
   * holding a list of { objectId, gain } objects to be passed on to the renderer on each device.
   *
   * @param {Object} options
   * @param {Array<MdoObject>} options.objects - list of objects, representing the production
   * metadata.
   * @param {Array<MdoDevice>} options.devices - list of devices, representing the current state
   * of available devices.
   * @param {MdoSession} options.session - object of global session state metadata
   * @param {AllocationAlgorithmResults} [options.previousResults] - the previous results object,
   * used for any state that needs to be remembered between runs
   *
   * @returns {AllocationAlgorithmResults}
   */
  allocate({
    objects,
    devices,
    session,
    previousResults = {},
  }) {
    const trace = this.saveSteps ? new AllocationTrace({ objects, devices }) : null;

    // Declare previous versions of the results, and set them to previous or default (empty) values.
    const {
      allocations: previousAllocations = {},
      runNumber: previousRunNumber = 0,
      objectIdsEverAllocated: previousObjectIdsEverAllocated = [],
    } = previousResults;

    // Initialise a map of functions to call after all objects have been allocated to devices.
    const postAllocationBehaviours = new Map();

    // Initialise object of allocations with an empty list for each device.
    // Initialise map of device flags as an empty set for each device.
    const allocations = {};
    const deviceFlags = new Map();
    devices.forEach(({ deviceId }) => {
      allocations[deviceId] = [];
      deviceFlags.set(deviceId, new Set());
    });

    if (trace) trace.start({ allocations, deviceFlags });

    // Iterate over all objects - each is processed only once.
    objects.forEach((object) => {
      const {
        objectId,
        objectBehaviours = [],
      } = object;

      if (trace) trace.nextObject(objectId);

      // Initialise lists (using Set to automatically avoid adding the same device multiple times).
      let previousDevices = new Set();
      let preferredDevices = new Set();
      let allowedDevices = new Set();
      const prohibitedDevices = new Set();

      // Initialise a set for the devices actually selected to play this object.
      const selectedDevices = new Set();

      // Initialise a set to remember any flags set by behaviours.
      const objectFlags = new Set();

      // Initialise an empty list of post-allocation behaviours for this object.
      postAllocationBehaviours.set(objectId, []);

      // Compute flags needed for change management: whether the object has ever been allocated, and
      // whether the object was allocated in the last run of the algorithm (because we need to know
      // this even if its previous device is no longer available, we can't use previousDevices).
      if (previousObjectIdsEverAllocated.includes(objectId)) {
        objectFlags.add('onChange-objectWasEverAllocated');
      }

      if (Object.values(previousAllocations)
        .some(deviceAllocation => deviceAllocation
          .some(objectInDevice => objectInDevice.objectId === objectId))) {
        objectFlags.add('onChange-objectWasInPreviousAllocation');
      }

      // define a helper for tracing the object state
      const traceUpdateObjectState = trace ? (step, activeObjectBehaviour) => {
        trace.updateObjectState({
          step,
          activeObjectBehaviour,
          objectLists: {
            previousDevices,
            preferredDevices,
            allowedDevices,
            prohibitedDevices,
            selectedDevices,
          },
          objectFlags,
        });
      } : null;

      // Populate the previousDevices list with the devices to which this object is assigned
      // in the previous allocation
      // previousDevices does not include devices that dropped out
      devices.forEach(({ deviceId }) => {
        if (previousAllocations[deviceId]) {
          if (previousAllocations[deviceId].some(x => x.objectId === objectId)) {
            previousDevices.add(deviceId);
          }
        }
      });

      if (trace) traceUpdateObjectState('find previous devices');

      // Exception: regardless of the exclusive behaviour.
      // If the exclusive flag is set on a device, it is prohibited.
      devices.forEach(({ deviceId }) => {
        if (deviceFlags.get(deviceId).has('hasExclusiveObject')) {
          prohibitedDevices.add(deviceId);
        }
      });

      if (trace) traceUpdateObjectState('prohibit devices with exclusive objects');

      // Process all the allocation behaviours added to the current object.
      objectBehaviours.forEach(({ behaviourType, behaviourParameters = {} }) => {
        if (this.behaviours.has(behaviourType)) {
          const behaviour = this.behaviours.get(behaviourType);

          // Run the behaviour; it returns lists of elements to add to the sets. This is to avoid
          // passing a writable set into the behaviour - behaviours are only allowed to add things.
          const {
            previous = [],
            preferred = [],
            allowed = [],
            prohibited = [],
            flags = [],
            postAllocationBehaviour = null,
          } = behaviour({
            behaviourParameters,
            object,
            objects,
            devices,
            previousAllocations,
            session,
            allocations,
            deviceFlags,
          });

          // Add the returned deviceIds for each list to the corresponding set.
          previous.forEach(deviceId => previousDevices.add(deviceId));
          preferred.forEach(deviceId => preferredDevices.add(deviceId));
          allowed.forEach(deviceId => allowedDevices.add(deviceId));
          prohibited.forEach(deviceId => prohibitedDevices.add(deviceId));

          // Save the returned object flags.
          flags.forEach(flag => objectFlags.add(flag));

          // Save the returned post-allocation behaviour
          if (postAllocationBehaviour) {
            postAllocationBehaviours.get(objectId).push(postAllocationBehaviour);
          }
        } else {
          console.warn(`Behaviour ${behaviourType} on object ${objectId} is not defined and will be ignored.`);
        }

        if (trace) traceUpdateObjectState(`results from ${behaviourType} behaviour`, behaviourType);
      });

      // Remove prohibited devices from other lists before change management
      // TODO: Check whether or not they need removing from previous devices
      previousDevices = setDifference(previousDevices, prohibitedDevices);
      preferredDevices = setDifference(preferredDevices, prohibitedDevices);
      allowedDevices = setDifference(allowedDevices, prohibitedDevices);
      if (trace) traceUpdateObjectState('remove prohibited devices');

      // Act on flags set by onChange behaviour
      if (previousRunNumber > 0 && objectFlags.has('onChange-applied')) {
        applyOnChangeBehaviour({
          objectFlags,
          previousDevices,
          preferredDevices,
          allowedDevices,
          prohibitedDevices,
        });
      }
      if (trace) traceUpdateObjectState('apply change management');

      previousDevices = setDifference(previousDevices, prohibitedDevices);
      preferredDevices = setDifference(preferredDevices, prohibitedDevices);
      allowedDevices = setDifference(allowedDevices, prohibitedDevices);
      if (trace) traceUpdateObjectState('remove prohibited devices again');

      // Select final device or devices
      if (objectFlags.has('spread')) {
        // Select all remaining devices (preferred, allowed) for spread objects
        [
          ...preferredDevices, ...allowedDevices,
        ].forEach(deviceId => selectedDevices.add(deviceId));

        if (trace) traceUpdateObjectState('select spread devices');
      } else {
        // Create a list of sets to choose from in order: if the first one is empty, try the second
        // one, etc.
        const setsToChooseFrom = [];

        setsToChooseFrom.push(preferredDevices);
        setsToChooseFrom.push(allowedDevices);

        // picking a random element from the first non-empty set.
        setsToChooseFrom.forEach((s) => {
          if (s.size < 1 || selectedDevices.size > 0) {
            return;
          }
          const randomIndex = parseInt(Math.random() * s.size, 0);
          selectedDevices.add([...s][randomIndex]);
        });

        if (trace) traceUpdateObjectState('select best allowed device');
      }

      // For now, always set gain to 1.0
      const gain = 1.0;

      // Copy selected devices into the allocations map with the gain value, and add any flags to
      // the selected devices.
      [...selectedDevices].forEach((deviceId) => {
        allocations[deviceId].push({ objectId, gain });
        if (objectFlags.has('exclusive')) {
          deviceFlags.get(deviceId).add('hasExclusiveObject');
        }
      });

      if (trace) trace.updateDeviceFlags();
    });

    // run any post-allocation behaviours that might modify rendering parameters
    Object.entries(allocations).forEach(([deviceId, deviceAllocations]) => {
      deviceAllocations.forEach(({ objectId }, i) => {
        postAllocationBehaviours.get(objectId).forEach((behaviour) => {
          const {
            gain = 1.0,
          } = behaviour({ deviceId });
          allocations[deviceId][i].gain *= gain; // effectively combining multiple gain stages
        });
      });
    });

    if (trace) trace.postAllocationBehaviourResults();

    // Create a new list of objectIds that were ever allocated by finding all objects allocated in
    // this run of the algorithm and then calculating the set union with the previous list.
    const objectIdsAllocated = [];
    Object.values(allocations)
      .forEach(deviceAllocations => deviceAllocations
        .forEach(({ objectId }) => objectIdsAllocated.push(objectId)));
    const objectIdsEverAllocated = [...setUnion(
      new Set(previousObjectIdsEverAllocated),
      new Set(objectIdsAllocated),
    )];

    // Return the results in the same format as the previousResults argument, this should be
    // remembered by the caller and passed in in the next run if they want to rely on state.
    return {
      allocations,
      runNumber: previousRunNumber + 1,
      objectIdsEverAllocated,
      steps: trace ? trace.getSteps() : undefined,
    };
  }
}

export default AllocationAlgorithm;
