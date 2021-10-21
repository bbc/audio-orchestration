/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from 'components/icon/Icon';

const DeviceList = ({
  devices,
  ownDeviceId,
  className,
}) => (
  <ul className={classnames('device-list', className)}>
    {devices.map(({
      deviceId,
      deviceType,
    }) => (
      <li
        key={deviceId}
        className={classnames(
          { 'device-list-self': deviceId === ownDeviceId },
        )}
      >
        <Icon name={deviceType} />
      </li>
    ))}
  </ul>
);

DeviceList.propTypes = {
  /* The list of connected devices. */
  devices: PropTypes.arrayOf(PropTypes.shape({
    /* The deviceId is a unique-in-the-session identifier for the device. */
    deviceId: PropTypes.string.isRequired,
    /* The deviceType should match an icon name, such as tv, desktop, laptop, mobile, tablet */
    deviceType: PropTypes.string.isRequired,
  })).isRequired,
  ownDeviceId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

DeviceList.defaultProps = {
  className: undefined,
};

export default DeviceList;
