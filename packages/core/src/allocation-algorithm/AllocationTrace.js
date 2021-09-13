class AllocationTrace {
  constructor({
    objects,
    devices,
    previousAllocations,
  }) {
    // create empty list of steps
    this.steps = [];

    // store inputs to the algorithm
    this.objects = objects;
    this.devices = devices;
    this.previousAllocations = previousAllocations;
  }

  addStep(name, {
    activeObject = null,
    activeObjectBehaviour = null,
    activeDevice = null,
    activeObjectState = null,
  } = {}) {
    const deviceState = {};
    if (this.allocations && this.deviceFlags) {
      this.devices.forEach(({ deviceId }) => {
        deviceState[deviceId] = {
          flags: [...this.deviceFlags.get(deviceId)].map((flag) => ({ name: flag, value: true })),
          objects: this.allocations[deviceId].map(({ objectId, gain }) => `${objectId} (${gain})`),
        };
      });
    }

    const objectState = {};
    if (activeObject && activeObjectState) {
      objectState[activeObject] = activeObjectState;
    }

    this.steps.push({
      name,
      activeObject,
      activeObjectBehaviour,
      activeDevice,
      deviceState,
      objectState,
    });
  }

  start({
    allocations,
    deviceFlags,
  }) {
    // store references to allocation and device flags objects.
    this.allocations = allocations;
    this.deviceFlags = deviceFlags;

    // add first step
    this.addStep('start');
  }

  nextObject(activeObject) {
    this.activeObject = activeObject;
    this.addStep('next object', { activeObject });
  }

  updateObjectState({
    step, activeObjectBehaviour, objectLists = {}, objectFlags = [],
  }) {
    const { activeObject } = this;

    const activeObjectState = {
      lists: Object.keys(objectLists).map((name) => ({
        name, items: [...objectLists[name]],
      })),
      flags: [...objectFlags].map((f) => ({ name: f, value: true })),
    };

    this.addStep(step, { activeObjectBehaviour, activeObject, activeObjectState });
  }

  updateDeviceFlags() {
    const { activeObject } = this;
    this.addStep('updateDeviceFlags', { activeObject });
  }

  postAllocationBehaviourResults() {
    this.addStep('post-allocation behaviour results', {});
  }

  getSteps() {
    return this.steps;
  }
}

export default AllocationTrace;
