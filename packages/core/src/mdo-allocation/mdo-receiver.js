import MdoHelper, { TOPICS, DEVICE_TYPE } from './mdo-helper';

/**
 * Maintains the local state necessary for an auxiliary device. Sends updates on this device's
 * controls, quality, etc; but mainly receives allocations from the main device.
 */
class MdoReceiver extends MdoHelper {
  /**
   * Called when an allocations message is received, updates the locally held allocations.
   */
  _handleRemoteAllocationsAndDevices({
    objectAllocations,
    controlAllocations,
    devices,
    schedule,
    contentId,
  }) {
    if (objectAllocations) this.setObjectAllocations(objectAllocations, contentId);
    if (controlAllocations) this.setControlAllocations(controlAllocations, contentId);
    if (devices) this.setDevices(devices);
    if (schedule) this.setSchedule(schedule);
    this._sendChangeEvent(contentId);
  }

  /**
   * Starts the receiver. Most initialisation is in the parent class, but the receiver specifically
   * has to ask for the schedule and allocations to be sent.
   */
  start(sync) {
    super.start(sync);

    this.on('metadata', () => {
      this._sync.sendMessage(TOPICS.DEVICE_METADATA, this._deviceMetadata);
    });

    // The new device will only be recognised after this first metadata update; and this update
    // also triggers an allocation and schedule update, needed for the orchestration client to
    // complete its initialisation.
    this.setDeviceMetadata({
      deviceType: DEVICE_TYPE.UNKNOWN,
      deviceIsMain: false,
    });
  }
}

export default MdoReceiver;
