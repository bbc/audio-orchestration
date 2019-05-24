import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import LocationSetting from '../../Components/AuxiliaryLocationSetting';

const AuxiliaryPlayingLocationPage = ({
  auxiliaryLocationOnClose,
  setDeviceLocation,
  deviceLocation,
}) => (
  <div className="page page-auxiliary-playing-location">
    <h1>
      Change Location
    </h1>

    <p>This is the auxiliary device playing location page.</p>

    <p>Select a location below.</p>

    <LocationSetting
      location={deviceLocation}
      onChange={location => setDeviceLocation(location)}
    />

    <LargeButton
      text="Close"
      secondaryText="Return to the player."
      onClick={() => auxiliaryLocationOnClose()}
    />
  </div>
);

AuxiliaryPlayingLocationPage.defaultProps = {
  deviceLocation: null,
};

AuxiliaryPlayingLocationPage.propTypes = {
  auxiliaryLocationOnClose: PropTypes.func.isRequired,
  setDeviceLocation: PropTypes.func.isRequired,
  deviceLocation: PropTypes.string,
};

export default AuxiliaryPlayingLocationPage;
