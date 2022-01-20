/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
