import MdoHelper, { TOPICS } from './mdo-helper';

/**
 * Maintains the local state ncessary for a slave device. Sends updates on this device's location,
 * quality, etc; but mainly receives allocations from the master device.
 */
class MdoReceiver extends MdoHelper {
  _handleDeviceMetadata(metadata) {
    super._handleDeviceMetadata(metadata);
    if (this._sync !== null) {
      this._sync.sendMessage(TOPICS.DEVICE_METADATA, Object.assign({}, {
        enabled: true,
      }, metadata));
    }

    // console.debug('MdoReceiver sending metadata update', metadata);
  }

  _handleRemoteAllocations({ allocations, contentId }) {
    this.setAllocations(allocations, contentId);
  }
}

export default MdoReceiver;
