/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
