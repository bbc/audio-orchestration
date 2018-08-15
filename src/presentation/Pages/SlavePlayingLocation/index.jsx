import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import LocationSetting from '../../Components/SlaveLocationSetting';

const SlavePlayingLocationPage = ({
  slaveLocationOnClose,
  setDeviceLocation,
  deviceLocation,
}) => (
  <div className="page page-slave-playing-location">
    <h1>
      Slave Playing Location
    </h1>

    <p>
      Tell us where you put this device and the sound it plays may change.
    </p>

    <LocationSetting
      distance={deviceLocation.distance}
      direction={deviceLocation.direction}
      onChange={location => setDeviceLocation(location)}
    />

    <LargeButton
      text="Close"
      secondaryText="return to the player"
      onClick={() => slaveLocationOnClose()}
    />
  </div>
);

SlavePlayingLocationPage.propTypes = {
  slaveLocationOnClose: PropTypes.func.isRequired,
  setDeviceLocation: PropTypes.func.isRequired,
  deviceLocation: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default SlavePlayingLocationPage;
