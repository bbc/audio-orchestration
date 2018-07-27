import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';
import Player from '../../Components/Player';
import ConnectionInstructions from './connection-instructions';
import LocationSetting from './location-setting';

const SlavePlaying = (props) => {
  const {
    sessionCode,
    deviceLocation,
    setDeviceLocation,
  } = props;

  return (
    <div className="page page-slave">
      <h1>
        Slave Device
      </h1>

      <Player {...props} />

      <LocationSetting
        direction={deviceLocation.direction}
        distance={deviceLocation.distance}
        onChange={setDeviceLocation}
      />

      <ConnectionInstructions {...{ sessionCode }} />
    </div>
  );
};

SlavePlaying.defaultProps = {
  sessionCode: '-'.repeat(SESSION_CODE_LENGTH),
};

SlavePlaying.propTypes = {
  sessionCode: PropTypes.string,
  deviceLocation: PropTypes.objectOf(PropTypes.string).isRequired,
  setDeviceLocation: PropTypes.func.isRequired,
};

export default SlavePlaying;
