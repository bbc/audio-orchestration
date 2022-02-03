/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import DeviceHelper, {
  DEFAULT_CONTENT_ID, DEVICE_STATUS, DEVICE_TYPE, TOPICS,
} from './DeviceHelper';
import { DefaultAllocationAlgorithm } from '../allocation';

const LOG_ALLOCATION_REASON = false;

/**
 * Allocates objects to devices, and keeps track of objects in the session. Must be run on the main
 * device, and will publish allocations for all devices whenever a change to any other device is
 * detected.
 */
class MainDeviceHelper extends DeviceHelper {
  constructor(deviceId, options = {}) {
    super(deviceId);
    this._deviceMetadata.deviceIsMain = true;
    this._deviceMetadata.deviceType = DEVICE_TYPE.UNKNOWN;

    // create the list of devices with only this device in it.
    this._allDevices = [
      { deviceJoiningNumber: 1, ...this._deviceMetadata },
    ];

    // create the set of enabled deviceIds with this device initially enabled
    this._enabledDeviceIds = new Set([deviceId]);

    // set the devices list on the parent class as well...
    this.setDevices(this.getEnabledDevices());

    // keep track of the last joining number to use, increment it when a new device joins
    this._lastJoiningNumber = 1;

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

    // current contentId; this is the sequence most recently requested to start playing
    this._currentContentId = null;

    // after this device's metadata is changed the parent class emits a metadata event, that is
    // used here to propagate the metadata to the devices list as well.
    this.on('metadata', () => {
      this._handleRemoteDeviceMetadata(this._deviceId, this._deviceMetadata);
    });
  }

  /**
   * register objects for a given content id. Ususally this would be done only once and immediately
   * after the sequence definition has been downloaded.
   *
   * @param {Array<MdoObject>} objects
   * @param {string} contentId
   */
  registerObjects(objects, contentId = DEFAULT_CONTENT_ID) {
    this._objects[contentId] = objects;
  }

  /**
   * Replace the controls.
   *
   * @param {Array<MdoControl>} controls
   */
  setControls(controls) {
    this._controls = controls;
  }

  /**
   * get a list of objects for the given contentId.
   */
  getObjects(contentId) {
    return (this._objects[contentId] || []).slice();
  }

  /**
   * Runs the allocation process based on the currently available object and device data for the
   * current contentId. Publishes the allocations and device list to all devices.
   *
   * @param {bool} [ignorePrevious] - whether to forget all previous allocation, treating all
   * currently registered devies as if they joined simultaneously.
   * @param {string} [reason] - reason for triggering the allocation, for debug logging only
   */
  allocate(ignorePrevious = false, reason = '') {
    const contentId = this._currentContentId;

    // If the content metadata file was not registered don't do anything.
    if (!contentId || !(contentId in this._objects)) {
      return;
    }

    if (LOG_ALLOCATION_REASON) console.debug(`allocate() ${ignorePrevious ? '' : 'not '}resetting state, because: ${reason}`);

    const objects = this.getObjects(contentId);
    const devices = this.getEnabledDevices();
    const session = {
      currentContentId: contentId,
      numDevices: this._enabledDeviceIds.size,
    };

    const objectAllocationResults = this._allocationAlgorithm.allocate({
      objects,
      devices,
      session,
      previousResults: ignorePrevious ? {} : this._objectAllocationResults[contentId],
    });

    // Save object allocation results
    this._objectAllocationResults[contentId] = objectAllocationResults;
    this.setObjectAllocations(objectAllocationResults.allocations, contentId);

    // Allocate controls for the given contentId
    // convert control metadata to the object metadata format expected by the allocation algorithm
    const controlAllocationResults = this._allocationAlgorithm.allocate({
      objects: this._controls.map(({ controlId, controlBehaviours }) => ({
        objectId: controlId,
        objectBehaviours: controlBehaviours,
      })),
      devices,
      session,
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
   * Broadcasts the current object and control allocations for the given contentId; also includes
   * the list of connected devices and their metadata.
   *
   * @param {string} contentId
   */
  _sendAllocations(contentId) {
    if (this._sync !== null
        && this._objectAllocations[contentId] !== undefined
        && this._controlAllocations[contentId] !== undefined
    ) {
      this._sync.sendMessage(TOPICS.ALLOCATIONS, {
        contentId,
        objectAllocations: this.objectAllocations[contentId],
        controlAllocations: this.controlAllocations[contentId],
        devices: this.devices,
        schedule: this.schedule,
      });

      this._sendChangeEvent(contentId);
    }
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
      this._enabledDeviceIds.add(deviceId);
      this.setDevices(this.getEnabledDevices());
    } else {
      this._enabledDeviceIds.delete(deviceId);
      this.setDevices(this.getEnabledDevices());
      this.allocate(false, 'a device left');
    }
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
    if (this._allDevices.find((d) => d.deviceId === deviceId) === undefined) {
      this._addDevice(deviceId);
    }

    this._allDevices = this._allDevices.map((d) => {
      if (d.deviceId === deviceId) {
        return { ...d, ...metadata };
      }
      return d;
    });

    // Update devices list
    this.setDevices(this.getEnabledDevices());

    // Allocate objects and controls, now the devices have changed
    this.allocate(false, 'device metadata received');
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
  _handleRemoteAllocationsAndDevices(allocations) {
    // eslint-disable-next-line no-console
    console.warn(
      'MainDeviceHelper should never receive a remote allocations object. Are there multiple main devices in the session?',
      allocations,
    );
  }

  /**
   * Creates a new device with the given deviceId and allocates its joining number.
   *
   * @param {string} deviceId
   *
   * @private
   */
  _addDevice(deviceId) {
    this._lastJoiningNumber += 1;
    this._allDevices = [
      ...this._allDevices.filter((d) => d.deviceId !== deviceId),
      {
        deviceId,
        deviceIsMain: false,
        deviceJoiningNumber: this._lastJoiningNumber,
      },
    ];
    this._enabledDeviceIds.add(deviceId);
    this.setDevices(this.getEnabledDevices());
  }

  startSequence(contentId, startSyncTime, startOffset = 0) {
    this._currentContentId = contentId;
    this.setSchedule([
      {
        contentId,
        startSyncTime,
        startOffset,
        stopSyncTime: null,
      },
      ...this._schedule.filter((schedule) => schedule.contentId !== contentId),
    ]);
  }

  stopSequence(contentId, stopSyncTime) {
    this.setSchedule([
      {
        contentId,
        startSyncTime: null,
        stopSyncTime,
      },
      ...this._schedule.filter((schedule) => schedule.contentId !== contentId),
    ]);
  }

  setSchedule(schedule) {
    super.setSchedule(schedule);
    this.allocate(true, 'schedule changed');
  }

  /**
   * Get a list of all enabled devices registered with this allocator, excluding the main device.
   *
   * @returns {Array<MdoDevice>}
   */
  getAuxiliaryDevices() {
    return this.getEnabledDevices()
      .filter(({ deviceIsMain }) => deviceIsMain === false);
  }

  /**
   * Get a list of all enabled devices registered with this allocator, and fill in their current
   * position in the join order.
   *
   * @returns {Array<MdoDevice>}
   */
  getEnabledDevices() {
    const devices = this._allDevices
      .filter(({ deviceId }) => this._enabledDeviceIds.has(deviceId) === true);

    // For each device, count the number of devices that have a lower or equal joining number to
    // find the deviceCurrentNumber (filling the gaps left by dropped out device).
    return devices.map((device) => ({
      ...device,
      deviceCurrentNumber: devices
        .filter(((d) => d.deviceJoiningNumber <= device.deviceJoiningNumber))
        .length,
    }));
  }
}

export default MainDeviceHelper;
