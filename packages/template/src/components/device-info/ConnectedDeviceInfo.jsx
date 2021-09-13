import { connect } from 'react-redux';
import DeviceInfo from './DeviceInfo';

const mapStateToProps = ({
  deviceId,
  currentContentId,
  connectedDevices,
  controlAllocations,
  objectAllocations,
}) => ({
  ownDeviceId: deviceId,
  currentContentId,
  connectedDevices,
  controlAllocations,
  objectAllocations,
});

export default connect(mapStateToProps)(DeviceInfo);
