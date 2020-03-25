import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from 'components/icon/Icon';

const DeviceList = ({
  devices,
  ownDeviceId,
}) => (
  <ul className={classnames('device-list')}>
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
};

export default DeviceList;
