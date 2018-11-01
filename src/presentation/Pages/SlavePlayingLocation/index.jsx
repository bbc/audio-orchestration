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
      Change Location
    </h1>

    <p>This is the auxiliary device playing location page.</p>

    <p>Select a location below.</p>

    <LocationSetting
      distance={deviceLocation.distance}
      direction={deviceLocation.direction}
      onChange={location => setDeviceLocation(location)}
    />

    <LargeButton
      text="Close"
      secondaryText="Return to the player."
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
