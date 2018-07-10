import MdoHelper, { DEFAULT_CONTENT_ID, DEVICE_STATUS, TOPICS } from './mdo-allocator';
import allocate from './allocate';

/**
 * Allocates objects to devices, and keeps track of objects in the session. Must be run on the main
 * device, and will publish allocations for all devices whenever a change to any other device is
 * detected.
 */
class MdoAllocator extends MdoHelper {
  constructor(deviceId) {
    super(deviceId);
    this._deviceMedata.mainDevice = true;

    // start the list of devices with only this device in it.
    this._devices = [
      Object.assign({}, this._deviceMetadata),
    ];

    this._objects = {};
  }

  /**
   * register objects for a given content id. Ususally this would be done only once and immediately
   * after the sequence definition has been downloaded. Triggers an allocation for this contentId.
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

    this._allocations[contentId] = allocate(
      this._objects[contentId],
      this._devices,
      this._allocations[contentId],
    );

    if (this._sync !== null) {
      this._sync.broadcast(TOPICS.ALLOCATIONS, {
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
    if (this._devices.find(d => d.deviceId === deviceId) === undefined) {
      this._addDevice(deviceId);
    }
    this._devices = this._devices.map((d) => {
      if (d.deviceId === deviceId) {
        return Object.assign({}, d, metadata);
      }
      return d;
    });

    this.allocate();
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
}

export default MdoAllocator;
