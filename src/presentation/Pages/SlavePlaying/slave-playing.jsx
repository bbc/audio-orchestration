import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';
import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import ConnectionInstructions from './connection-instructions';
import LocationSetting from './location-setting';

const SlavePlaying = (props) => {
  const {
    sessionCode,
    deviceLocation,
    setDeviceLocation,
    activeObjectIds,
  } = props;

  return (
    <div className="page page-slave">
      <h1>
        Auxiliary Device
      </h1>
      <Player {...props} />
      <LocationSetting
        direction={deviceLocation.direction}
        distance={deviceLocation.distance}
        onChange={setDeviceLocation}
      />
      <ObjectList objectIds={activeObjectIds} />
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
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SlavePlaying;
