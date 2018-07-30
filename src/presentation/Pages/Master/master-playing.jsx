import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';
import Player from '../../Components/Player';

const MasterPlaying = (props) => {
  const {
    sessionCode,
    connectedDevices,
  } = props;

  return (
    <div className="page page-master">
      <h1>
        Master Device
      </h1>

      <p>
        { `Join with code ${sessionCode}` }
      </p>

      <Player {...props} />

      <ul>
        { connectedDevices.map(({ deviceId, deviceType, deviceLocation }) => (
          <li key={deviceId}>
            {`${deviceType} (${deviceLocation})`}
          </li>
        ))}
      </ul>
    </div>
  );
};

MasterPlaying.defaultProps = {
  sessionCode: '-'.repeat(SESSION_CODE_LENGTH),
};

MasterPlaying.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string,
};

export default MasterPlaying;
