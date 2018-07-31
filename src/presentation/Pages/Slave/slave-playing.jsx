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
      <div className="gel-layout">
        <div className="gel-1/1">
          <h1>
            Slave Device
          </h1>
        </div>
      </div>

      <div className="gel-layout">
        <div className="gel-1/1">
          <Player {...props} />
        </div>
      </div>

      <div className="gel-layout">
        <div className="gel-1/1">
          <LocationSetting
            direction={deviceLocation.direction}
            distance={deviceLocation.distance}
            onChange={setDeviceLocation}
          />
        </div>
      </div>

      <div className="gel-layout">
        <div className="gel-1/1">
          <ConnectionInstructions {...{ sessionCode }} />
        </div>
      </div>
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
