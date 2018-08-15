import React from 'react';
import PropTypes from 'prop-types';

// TODO add toggle to show device addition instructions on + click
import ConnectionInstructions from './ConnectionInstructions';

const DeviceList = ({
  placeholderText,
  showInstructions,
  devices,
}) => (
  <div>
    { (devices.length === 0 && placeholderText !== '')
      ? (
        <p>
          { placeholderText }
        </p>
      )
      : (
        <ul>
          { devices.map(({ deviceId, deviceType, deviceLocation }) => (
            <li key={deviceId}>
              {`${deviceType} (${deviceLocation})`}
            </li>
          ))}
          { showInstructions
            ? (
              <li>
                +
              </li>
            )
            : null
          }
        </ul>
      )
    }
  </div>
);

DeviceList.defaultProps = {
  placeholderText: '',
  showInstructions: false,
  sessionCode: '',
  baseUrl: '',
};

DeviceList.propTypes = {
  placeholderText: PropTypes.string,
  showInstructions: PropTypes.bool,
  devices: PropTypes.arrayOf(PropTypes.string).isRequired,
  sessionCode: PropTypes.string,
  baseUrl: PropTypes.string,
};

export default DeviceList;
