import AllocationTrace from './AllocationTrace';

// const setUnion = (s1, s2) => new Set([...s1, ...s2]);
const setIntersection = (s1, s2) => new Set([...s1].filter(x => s2.has(x)));
const setDifference = (s1, s2) => new Set([...s1].filter(x => !s2.has(x)));

/**
 * Represents the generic allocation algorithm. To be useful, it must be extended by registering
 * the behaviours referred to in the object metadata. See {@link DefaultAllocationAlgorithm} for
 * the implementation of the default behaviours.
 *
 * The algorithm is stateless, in that the previousAllocations are only used if passed in.
 * Therefore the same instance can be used to allocate objects for different sets of objects
 * independently.
 *
 * @example
 * const a = new AllocationAlgorithm();
 * a.registerBehaviour('allowEverything', ({ devices }) => ({
 *   allowed: devices.map(d => d.deviceId),
 * });
 * const allocations = a.allocate({ objects, devices, session, previousAllocations });
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
   * @param {MdoAllocations} options.previousAllocations - a previously returned allocations map
   *
   * @return {Object}
   * @property {MdoAllocations} allocations - the new allocations
   * @property {Array<Object>} steps - if options.saveSteps was set, the traced steps (see
   * {@link AllocationTrace} for the format).
   */
  allocate({
    objects,
    devices,
    session,
    previousAllocations,
  }) {
    const trace = this.saveSteps ? new AllocationTrace({ objects, devices }) : null;

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

      // Begin selecting the actual device/s for this object
      // Remove prohibited devices
      previousDevices = setDifference(previousDevices, prohibitedDevices);
      preferredDevices = setDifference(preferredDevices, prohibitedDevices);
      allowedDevices = setDifference(allowedDevices, prohibitedDevices);
      if (trace) traceUpdateObjectState('remove prohibited devices');

      // Ignore previous devices if the object should always be allowed to move on a change.
      if (objectFlags.has('alwaysMove')) {
        previousDevices = new Set();
      }

      if (objectFlags.has('spread')) {
        // Select all remaining devices (previous, preferred, allowed) for spread objects
        [
          ...previousDevices, ...preferredDevices, ...allowedDevices,
        ].forEach(deviceId => selectedDevices.add(deviceId));

        if (trace) traceUpdateObjectState('select spread devices');
      } else {
        // Create a list of sets to choose from in order: if the first one is empty, try the second
        // one, etc.
        const setsToChooseFrom = [];

        // TODO I think the logic here is not quite consistent with proposal
        if (objectFlags.has('moveToPreferredOnly')) {
          setsToChooseFrom.push(setIntersection(previousDevices, preferredDevices));
        } else {
          setsToChooseFrom.push(previousDevices);
          setsToChooseFrom.push(preferredDevices);
          setsToChooseFrom.push(allowedDevices);
        }

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

    return {
      allocations,
      steps: trace ? trace.getSteps() : null,
    };
  }
}

export default AllocationAlgorithm;
