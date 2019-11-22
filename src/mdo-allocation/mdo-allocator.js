import MdoHelper, { DEFAULT_CONTENT_ID, DEVICE_STATUS, TOPICS } from './mdo-helper';
import { DefaultAllocationAlgorithm } from '../allocation-algorithm';

/**
 * Allocates objects to devices, and keeps track of objects in the session. Must be run on the main
 * device, and will publish allocations for all devices whenever a change to any other device is
 * detected.
 */
class MdoAllocator extends MdoHelper {
  constructor(deviceId, options = {}) {
    super(deviceId);
    this._deviceMetadata.deviceIsMain = true;

    // start the list of devices with only this device in it.
    this._devices = [
      Object.assign({}, this._deviceMetadata),
    ];

    this._enabledDevices = new Set([deviceId]);

    // create an empty object to hold an objects array for each contentId.
    this._objects = {};

    // create an empty list to hold the controls
    this._controls = [];

    // use either a supplied allocation algorithm or instantiate the default algorithm.
    this._allocationAlgorithm = options.allocationAlgorithm || new DefaultAllocationAlgorithm();

    // create an empty object to hold the previous results from the allocation algorithm, indexed
    // by contentId.
    this._objectAllocationResults = {};
    this._controlAllocationResults = {};

    // after this device's metadata is changed the parent class emits a metadata event, that is
    // used here to propagate the metadata to the devices list as well.
    this.on('metadata', () => {
      this._handleRemoteDeviceMetadata(this._deviceId, this._deviceMetadata);
    });
  }

  /**
   * register objects for a given content id. Ususally this would be done only once and immediately
   * after the sequence definition has been downloaded. Triggers an allocation for this contentId.
   *
   * @param {Array<MdoObject>} objects
   * @param {string} contentId
   */
  registerObjects(objects, contentId = DEFAULT_CONTENT_ID) {
    this._objects[contentId] = objects;
    this.allocate(contentId);
  }

  /**
   * Replace the controls. Triggers an allocation for all sequences.
   *
   * @param {Array<MdoControl>} controls
   */
  setControls(controls) {
    this._controls = controls;
    this.allocateAll();
  }

  /**
   * get a list of objects for the given contentId.
   */
  getObjects(contentId) {
    return (this._objects[contentId] || []).slice();
  }

  /**
   * Runs the allocation process based on the currently available object and device data for one
   * contentId. Publishes the allocations to all other devices if a sync adapter has been set.
   *
   * @param {string} contentId
   * @param {bool} ignorePrevious - resets all previous allocation, treats all currently registered
   * devies as if they joined simultaneously.
   */
  allocate(contentId, ignorePrevious = false) {
    // If the content metadata file was not registered don't do anything.
    if (!(contentId in this._objects)) {
      return;
    }

    // console.debug(
    //   'calling allocate()',
    //   this._objects[contentId],
    //   this._devices,
    //   ignorePrevious ? {} : this._objectAllocationResults[contentId],
    // );

    // Allocate objects for the given contentId
    // TODO add session metadata
    const objectAllocationResults = this._allocationAlgorithm.allocate({
      objects: this._objects[contentId],
      devices: this._devices,
      previousResults: ignorePrevious ? {} : this._objectAllocationResults[contentId],
    });

    // Save object allocation results
    this._objectAllocationResults[contentId] = objectAllocationResults;
    this.setObjectAllocations(objectAllocationResults.allocations, contentId);

    // Allocate controls for the given contentId
    // convert control metadata to the object metadata format expected by the allocation algorithm
    // TODO add session metadata including contentId
    const controlAllocationResults = this._allocationAlgorithm.allocate({
      objects: this._controls.map(({ controlId, controlBehaviours }) => ({
        objectId: controlId,
        objectBehaviours: controlBehaviours,
      })),
      devices: this._devices,
      previousResults: ignorePrevious ? {} : this._controlAllocationResults[contentId],
    });

    // Save control allocation results; converting the results back to use controlId instead of
    // objectId.
    this._controlAllocationResults[contentId] = controlAllocationResults;
    const controlAllocations = {};
    Object.entries(controlAllocationResults.allocations).forEach(([deviceId, controlsList]) => {
      controlAllocations[deviceId] = controlsList.map(({ objectId }) => ({ controlId: objectId }));
    });
    this.setControlAllocations(controlAllocations, contentId);

    // Send both types of allocation results to other devices in the session
    this._sendAllocations(contentId);
  }

  /**
   * Broadcasts allocations for all registered contentIds.
   */
  _sendAllAllocations() {
    Object.keys(this._objects).forEach(contentId => this._sendAllocations(contentId));
  }

  /**
   * Broadcasts the current object and control allocations for the given contentId.
   *
   * @param {string} contentId
   */
  _sendAllocations(contentId) {
    if (this._sync !== null && this._objectAllocations[contentId] !== undefined) {
      this._sync.sendMessage(TOPICS.ALLOCATIONS, {
        contentId,
        objectAllocations: this._objectAllocations[contentId] || {},
        controlAllocations: this._controlAllocations[contentId] || {},
      });
    }
  }

  /**
   * Triggers the allocation process for every contentId registered with {@link registerObjects}.
   */
  allocateAll(reset = false) {
    Object.keys(this._objects).forEach(contentId => this.allocate(contentId, reset));
  }

  /**
   * Handles a device presence event. This updates the device's 'enabled' flag.
   *
   * @param {string} deviceId
   * @param {string} status
   *
   * @private
   */
  _handleRemotePresence(deviceId, status) {
    if (status === DEVICE_STATUS.ONLINE) {
      this._enabledDevices.add(deviceId);
    } else {
      this._enabledDevices.delete(deviceId);
    }

    this.allocateAll();
  }

  /**
   * Handles a remote metadata change event, updating the internal list of devices. Called when
   * some device has joined or left the session, or has changed its metadata.
   *
   * @param {string} deviceId
   * @param {object} metadata
   */
  _handleRemoteDeviceMetadata(deviceId, metadata) {
    // console.debug('remote device metadata', deviceId, metadata);

    if (this._devices.find(d => d.deviceId === deviceId) === undefined) {
      this._addDevice(deviceId);
    }

    this._devices = this._devices.map((d) => {
      if (d.deviceId === deviceId) {
        return Object.assign({}, d, metadata);
      }
      return d;
    });

    this.allocateAll();
  }

  /**
   * Handles an allocations event, triggered by a different device. This should never be called,
   * as there can only be one main device (and it is represented by _this_ allocator).
   *
   * @param {MdoAllocations} allocations
   *
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  _handleRemoteAllocations(allocations) {
    // eslint-disable-next-line no-console
    console.warn(
      'MdoAllocator should never receive a remote allocations object. Are there multiple Allocators in the session?',
      allocations,
    );
  }

  /**
   * Creates a new empty device with the given deviceId.
   *
   * @param {string} deviceId
   *
   * @private
   */
  _addDevice(deviceId) {
    this._devices = [
      ...this._devices.filter(d => d.deviceId !== deviceId),
      {
        deviceId,
        deviceIsMain: false,
      },
    ];
  }

  _handleRemoteSchedule({ schedule }) {
    this.setSchedule(schedule);
  }

  _handleRequestAllocationsAndSchedule() {
    this._sendAllAllocations();
    this._sendSchedule();
  }

  startSequence(contentId, startSyncTime, startOffset = 0) {
    this.setSchedule([
      {
        contentId,
        startSyncTime,
        startOffset,
        stopSyncTime: null,
      },
      ...this._schedule.filter(schedule => schedule.contentId !== contentId),
    ]);
  }

  stopSequence(contentId, stopSyncTime) {
    this.setSchedule([
      {
        contentId,
        startSyncTime: null,
        stopSyncTime,
      },
      ...this._schedule.filter(schedule => schedule.contentId !== contentId),
    ]);
  }

  setSchedule(schedule) {
    super.setSchedule(schedule);
    // TODO: resets the allocation state for all sequences, but should only do it for the one we
    // are about to transition into.
    this.allocateAll(true);
    this._sendSchedule();
  }

  _sendSchedule() {
    if (this._sync !== null) {
      this._sync.sendMessage(TOPICS.SCHEDULE, {
        schedule: this._schedule,
      });
    }
  }

  /**
   * Get a list of all enabled devices registered with this allocator, excluding the main device.
   *
   * @returns {Array<MdoDevice>}
   */
  getAuxiliaryDevices() {
    return this._devices
      .filter(({ deviceIsMain }) => deviceIsMain === false)
      .filter(({ deviceId }) => this._enabledDevices.has(deviceId) === true);
  }

  /**
   * Get a list of all enabled devices registered with this allocator
   *
   * @returns {Array<MdoDevice>}
   */
  getDevices() {
    return this._devices
      .filter(({ deviceId }) => this._enabledDevices.has(deviceId) === true);
  }
}

export default MdoAllocator;
