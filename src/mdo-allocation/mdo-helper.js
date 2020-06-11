import EventEmitter from 'events';

export const DEVICE_TYPE = {
  UNKNOWN: 'unknown',
  DESKTOP: 'desktop',
  LAPTOP: 'laptop',
  PHONE: 'mobile',
  TABLET: 'tablet',
  TV: 'tv',
  SMART_SPEAKER: 'smart-speaker',
  TEAPOT: 'teapot',
};

export const DEVICE_STATUS = {
  OFFLINE: 'offline',
  ONLINE: 'online',
};

export const TOPICS = {
  DEVICE_METADATA: 'mdo-device-metadata',
  ALLOCATIONS: 'mdo-allocations',
  REQUEST_ALLOCATIONS_AND_SCHEDULE: 'mdo-request-allocations-and-schedule',
  SCHEDULE: 'mdo-schedule',
  CUSTOM: 'mdo-custom',
};

export const DEFAULT_CONTENT_ID = 'default';

/**
 * The MdoHelper is a base class defining the common interface for the {@link MdoAllocator}
 * and the {@link MdoReceiver}.
 *
 * This class is not designed to be instantiated directly.
 *
 * @emits 'change' when the allocations have changed for a content id, regardless of whether the
 * active objects for this device have changed.
 */
class MdoHelper extends EventEmitter {
  constructor(deviceId) {
    super();
    this._deviceId = deviceId;

    /**
     * @private
     *
     * Locally held metadata about this device.
     */
    this._deviceMetadata = {
      deviceId,
      deviceIsMain: false,
      deviceControls: [],
      deviceLatency: 0,
      deviceGain: 1,
      deviceType: null,
    };

    /**
     * @private
     *
     * The object allocations containing a list of objects for each device for each contentId.
     */
    this._objectAllocations = {};

    /**
     * @private
     *
     * The control allocations containing a list of controls for each device for each contentId.
     */
    this._controlAllocations = {};

    /**
     * @private
     *
     * The locally held schedule for when sequences should start playing relative to the master
     * experience timeline.
     */
    this._schedule = [];

    /**
     * @private
     *
     * A reference to the synchronisation client, used communicating with other devices in the
     * session.
     */
    this._sync = null;
  }

  /**
   * @param {MdoAllocations} objectAllocations
   * @param {string} [contentId]
   */
  setObjectAllocations(objectAllocations, contentId = DEFAULT_CONTENT_ID) {
    this._objectAllocations[contentId] = objectAllocations;
    // TODO combine with setControlAllocations and only send one change event?
    // TODO consider storing only the allocations for this device?
    this.emit('change', {
      contentId,
      activeObjects: this.getActiveObjects(contentId),
    });
  }

  /**
   * @param {MdoAllocations} controlAllocations
   * @param {string} [contentId]
   */
  setControlAllocations(controlAllocations, contentId = DEFAULT_CONTENT_ID) {
    this._controlAllocations[contentId] = controlAllocations;
    this.emit('change', {
      contentId,
      activeControls: this.getActiveControls(contentId),
    });
  }

  /**
   * Get the current object allocations for all devices.
   *
   * @param {string} [contentId]
   *
   * @returns {MdoAllocations}
   */
  getObjectAllocations(contentId = DEFAULT_CONTENT_ID) {
    return Object.assign({}, this._objectAllocations[contentId]);
  }

  /**
   * Get the current control allocations for all devices.
   *
   * @param {string} [contentId]
   *
   * @returns {MdoAllocations}
   */
  getControlAllocations(contentId = DEFAULT_CONTENT_ID) {
    return Object.assign({}, this._controlAllocations[contentId]);
  }

  /**
   * Get the active objects for this device for a given contentId.
   *
   * @param {string} contentId
   *
   * @returns {Array<string>} objectIds; an empty list is returned if the contentId or deviceId
   * does not have any allocations.
   *
   * TODO: Gain property is ignored.
   */
  getActiveObjects(contentId = DEFAULT_CONTENT_ID) {
    const allocations = this._objectAllocations[contentId] || {};
    const objectsList = allocations[this._deviceId] || [];
    return objectsList.map(({ objectId }) => objectId);
  }

  /**
   * Get the active controls for this device for a given contentId.
   *
   * @param {string} contentId
   *
   * @returns {Array<string>} controlIds; an empty list is returned if the contentId or deviceId
   * does not have any allocations.
   */
  getActiveControls(contentId = DEFAULT_CONTENT_ID) {
    const allocations = this._controlAllocations[contentId] || {};
    const controlsList = allocations[this._deviceId] || [];
    return controlsList.map(({ controlId }) => controlId);
  }

  /**
   * Register event handlers on this object and the given {@link SyncAdapter}.
   * Subclasses must implement the methods registered here.
   *
   * @param {SyncAdapter} sync
   */
  start(sync) {
    this._sync = sync;

    sync.on('broadcast', ({ deviceId, topic, content }) => {
      if (deviceId === this._deviceId) {
        // ignore any messages sent by this device.
        return;
      }
      switch (topic) {
        case TOPICS.ALLOCATIONS:
          this._handleRemoteAllocations(content);
          break;
        case TOPICS.DEVICE_METADATA:
          this._handleRemoteDeviceMetadata(deviceId, content);
          break;
        case TOPICS.SCHEDULE:
          this._handleRemoteSchedule(content);
          break;
        case TOPICS.REQUEST_ALLOCATIONS_AND_SCHEDULE:
          this._handleRequestAllocationsAndSchedule();
          break;
        case TOPICS.CUSTOM:
          this.emit('message', content.message);
          break;
        default:
      }
    });

    sync.on('presence', ({ deviceId, status }) => {
      if (deviceId === this._deviceId) {
        // ignore any messages sent by this device.
        return;
      }
      this._handleRemotePresence(deviceId, status);
    });
  }

  /**
   * Update a subset of the device metadata. The main device metadata properties are:
   *
   * * `deviceType`
   * * `deviceGain`
   * * `deviceLatency`
   * * `deviceControls`
   *
   * @param {Object} metadata
   */
  setDeviceMetadata(metadata) {
    this._deviceMetadata = Object.assign({}, this._deviceMetadata, metadata);
    this.emit('metadata', this._deviceMetadata);
  }

  /**
   * set the schedule for the synchronised sequences.
   *
   * @param {Array<MdoSequenceSchedule>} schedule
   */
  setSchedule(schedule) {
    this._schedule = schedule;
    this.emit('schedule', schedule);
  }

  /**
   * Send a custom message to all devices in the same session.
   *
   * @param {string} topic
   * @param {object} message
   */
  sendCustomMessage(message) {
    if (this._sync !== null) {
      this._sync.sendMessage(TOPICS.CUSTOM, { message });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _handleRemotePresence() {}

  // eslint-disable-next-line class-methods-use-this
  _handleRemoteAllocations() {}

  // eslint-disable-next-line class-methods-use-this
  _handleRemoteSchedule() {}

  // eslint-disable-next-line class-methods-use-this
  _handleRequestAllocationsAndSchedule() {}

  // eslint-disable-next-line class-methods-use-this
  _handleRemoteDeviceMetadata() {}
}

export default MdoHelper;
