import { connect } from 'react-redux';
import DeviceList from './DeviceList';

const mapStateToProps = ({
  connectedDevices,
  deviceId,
}) => ({
  devices: connectedDevices,
  ownDeviceId: deviceId,
});

export default connect(mapStateToProps, null)(DeviceList);
