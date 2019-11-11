import MdoHelper, { TOPICS } from './mdo-helper';

/**
 * Maintains the local state necessary for an auxiliary device. Sends updates on this device's
 * controls, quality, etc; but mainly receives allocations from the main device.
 */
class MdoReceiver extends MdoHelper {
  /**
   * Called when an allocations message is received, updates the locally held allocations.
   */
  _handleRemoteAllocations({ allocations, contentId }) {
    this.setAllocations(allocations, contentId);
  }

  /**
   * Called when a schedule message is received, updates teh locally held schedule.
   */
  _handleRemoteSchedule({ schedule }) {
    this.setSchedule(schedule);
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

    this._sendRequestScheduleAndAllocations();
  }

  /**
   * Sends a message for the main device to resend the current allocations and schedule
   * information.
   */
  _sendRequestScheduleAndAllocations() {
    if (this._sync !== null) {
      this._sync.sendMessage(TOPICS.REQUEST_ALLOCATIONS_AND_SCHEDULE, {});
    }
  }
}

export default MdoReceiver;
