import MdoHelper, { DEFAULT_CONTENT_ID, DEVICE_STATUS, TOPICS } from './mdo-helper';
import allocate from './allocate';

/**
 * Allocates objects to devices, and keeps track of objects in the session. Must be run on the main
 * device, and will publish allocations for all devices whenever a change to any other device is
 * detected.
 */
class MdoAllocator extends MdoHelper {
  constructor(deviceId) {
    super(deviceId);
    this._deviceMetadata.mainDevice = true;

    // start the list of devices with only this device in it.
    this._devices = [
      Object.assign({}, this._deviceMetadata),
    ];

    this._objects = {};
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
   */
  allocate(contentId) {
    if (!(contentId in this._objects)) {
      return;
    }

    console.debug(
      'calling allocate()',
      this._objects[contentId],
      this._devices,
      this._allocations[contentId],
    );

    this.setAllocations(
      allocate(this._objects[contentId], this._devices, this._allocations[contentId]),
      contentId,
    );

    this._sendAllocations(contentId);
  }

  /**
   * Broadcasts allocations for all registered contentIds.
   */
  _sendAllAllocations() {
    Object.keys(this._allocations).forEach(contentId => this._sendAllocations(contentId));
  }

  /**
   * Broadcasts the current object allocations for the given contentId.
   *
   * @param {string} contentId
   */
  _sendAllocations(contentId) {
    if (this._sync !== null && this._allocations[contentId] !== undefined) {
      this._sync.sendMessage(TOPICS.ALLOCATIONS, {
        contentId,
        allocations: this._allocations[contentId],
      });
    }
  }

  /**
   * Triggers the allocation process for every contentId registered with {@link registerObjects}.
   */
  allocateAll() {
    Object.keys(this._objects).forEach(contentId => this.allocate(contentId));
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
    this._handleRemoteDeviceMetadata(deviceId, { enabled: (status === DEVICE_STATUS.ONLINE) });
  }

  /**
   * Handles a remote metadata change event, updating the internal list of devices. Called when
   * some device has joined or left the session, or has changed its location, quality, or type.
   *
   * @param {string} deviceId
   * @param {object} metadata
   */
  _handleRemoteDeviceMetadata(deviceId, metadata) {
    console.debug('remote device metadata', deviceId, metadata);

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
      'MdoAllocator should never receive a remote allocations object. Are there too many Masters?',
      `${allocations.map(({ contentId }) => contentId).join(', ')}`,
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
      {
        deviceId,
        location: {},
        quality: 1,
        mainDevice: false,
      },
      ...this._devices.filter(d => d.deviceId !== deviceId),
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
    this._sendSchedule();
  }

  _sendSchedule() {
    if (this._sync !== null) {
      this._sync.sendMessage(TOPICS.SCHEDULE, {
        schedule: this._schedule,
      });
    }
  }
}

export default MdoAllocator;
