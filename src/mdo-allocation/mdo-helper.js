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
    this._deviceMetadata = {
      deviceId,
      location: { distance: null, direction: null },
      quality: 1,
      enabled: true,
      deviceType: null,
      mainDevice: false,
    };
    this._allocations = [];
    this._schedule = [];
    this._sync = null;
  }

  setAllocations(allocations, contentId = DEFAULT_CONTENT_ID) {
    this._allocations[contentId] = allocations;
    this.emit('change', {
      contentId,
      activeObjects: this.getActiveObjects(contentId),
    });
  }

  /**
   * Get the current allocations for all objects.
   *
   * @param {string} contentId
   *
   * @returns {MdoAllocations}
   */
  getAllocations(contentId = DEFAULT_CONTENT_ID) {
    return Object.assign({}, this._allocations[contentId]);
  }

  /**
   * Get the active objects for this device for a given contentId.
   *
   * @param {string} contentId
   *
   * @returns {Array<string>} objectIds; an empty list is returned if the contentId or deviceId
   * does not have any allocations.
   */
  getActiveObjects(contentId = DEFAULT_CONTENT_ID) {
    const allocations = this._allocations[contentId] || {};
    return Object.entries(allocations)
      .filter(([, deviceIds]) => deviceIds.includes(this._deviceId))
      .map(([objectId]) => objectId);
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

    this.on('location', (location) => {
      this._handleDeviceMetadata({ location });
    });

    this.on('quality', (quality) => {
      this._handleDeviceMetadata({ quality });
    });

    this.on('deviceType', (deviceType) => {
      this._handleDeviceMetadata({ deviceType });
    });
  }

  /**
   * set the deviceType for this device.
   *
   * @param {string} deviceType
   */
  setDeviceType(deviceType) {
    this._deviceMetadata.deviceType = deviceType;
    this.emit('deviceType', deviceType);
  }

  /**
   * set the location for this device.
   *
   * @param {MdoLocation} location
   */
  setLocation({ direction = null, distance = null } = {}) {
    if (direction !== null) {
      this._deviceMetadata.location.direction = direction;
    }
    if (distance !== null) {
      this._deviceMetadata.location.distance = distance;
    }
    this.emit('location', this._deviceMetadata.location);
  }

  /**
   * set the quality for this device.
   *
   * @param {number} quality
   */
  setQuality(quality) {
    this._deviceMetadata.quality = quality;
    this.emit('quality', quality);
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
   * Store changes to _this device's_ metadata.
   *
   * Sub-classes should extend this method and call super(metadata) to ensure that the local
   * deviceMetadata copy is kept up to date.
   *
   * @param {object} metadata
   */
  _handleDeviceMetadata(metadata) {
    this._deviceMetadata = Object.assign({}, this._deviceMetadata, metadata);
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
