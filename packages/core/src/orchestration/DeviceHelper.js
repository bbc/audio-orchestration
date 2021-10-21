/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
  DEVICE_METADATA: 'mdo-set-device-metadata',
  ALLOCATIONS: 'mdo-allocations',
  CUSTOM: 'mdo-custom',
};

export const DEFAULT_CONTENT_ID = 'default';

/**
 * The DeviceHelper is a base class defining the common interface for the {@link MainDeviceHelper}
 * and the {@link AuxDeviceHelper}.
 *
 * This class is not designed to be instantiated directly.
 *
 * @emits 'change' when the allocations have changed for a content id, regardless of whether the
 * active objects for this device have changed.
 */
class DeviceHelper extends EventEmitter {
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
     * The locally held schedule for when sequences should start playing relative to the primary
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
  }

  /**
   * @param {MdoAllocations} controlAllocations
   * @param {string} [contentId]
   */
  setControlAllocations(controlAllocations, contentId = DEFAULT_CONTENT_ID) {
    this._controlAllocations[contentId] = controlAllocations;
  }

  setDevices(devices) {
    this._devices = devices;
  }

  /**
   * Notifies the OrchestrationClient that the devices, object, or control allocations have changed.
   *
   * @param {string} contentId
   */
  _sendChangeEvent(contentId) {
    this.emit('change', { contentId });
  }

  /**
   * Get the current object allocations for all devices.
   *
   * @param {string} [contentId]
   *
   * @returns {MdoAllocations}
   */
  getObjectAllocations(contentId = DEFAULT_CONTENT_ID) {
    return { ...this._objectAllocations[contentId] };
  }

  /**
   * Get the current control allocations for all devices.
   *
   * @param {string} [contentId]
   *
   * @returns {MdoAllocations}
   */
  getControlAllocations(contentId = DEFAULT_CONTENT_ID) {
    return { ...this._controlAllocations[contentId] };
  }

  /**
   * Get the active objects for this device for a given contentId.
   *
   * @param {string} contentId
   *
   * @returns {Array<MdoAllocatedObject>} of shape {objectId, objectGain}; an empty list is
   * returned if the contentId or deviceId does not have any allocations.
   */
  getActiveObjects(contentId = DEFAULT_CONTENT_ID) {
    const allocations = this._objectAllocations[contentId] || {};
    const objectsList = allocations[this._deviceId] || [];
    return objectsList.map(({ objectId, objectGain }) => ({
      objectId,
      objectGain,
    }));
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
          // main device broadcasts object and/or control allocations
          this._handleRemoteAllocationsAndDevices(content);
          break;
        case TOPICS.DEVICE_METADATA:
          // aux device sends its updated metadata
          this._handleRemoteDeviceMetadata(deviceId, content);
          break;
        case TOPICS.CUSTOM:
          // any device may send a custom message
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
   * * `deviceControls`
   *
   * @param {Object} metadata
   */
  setDeviceMetadata(metadata) {
    this._deviceMetadata = { ...this._deviceMetadata, ...metadata };
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
  _handleRemoteAllocationsAndDevices() {}

  // eslint-disable-next-line class-methods-use-this
  _handleRemoteDeviceMetadata() {}

  get devices() {
    return this._devices;
  }

  get objectAllocations() {
    return this._objectAllocations;
  }

  get controlAllocations() {
    return this._controlAllocations;
  }

  get schedule() {
    return this._schedule;
  }
}

export default DeviceHelper;
