import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import LocationSetting from '../../Components/AuxiliaryLocationSetting';

const AuxiliarySetupLocationPage = ({
  auxiliaryLocationOnClose,
  setDeviceLocation,
  deviceLocation,
}) => (
  <div className="page page-auxiliary-setup-location">
    <h1>
      Set Location
    </h1>

    <p>This is the auxiliary device setup location page.</p>

    <p>Select a location below.</p>

    <LocationSetting
      location={deviceLocation}
      onChange={location => setDeviceLocation(location)}
    />

    <LargeButton
      text="Continue"
      secondaryText="Close the location page."
      disabled={!deviceLocation}
      onClick={() => auxiliaryLocationOnClose()}
    />

    <StepProgressIndicator step={3} numSteps={3} />
  </div>
);

AuxiliarySetupLocationPage.defaultProps = {
  deviceLocation: null,
};

AuxiliarySetupLocationPage.propTypes = {
  auxiliaryLocationOnClose: PropTypes.func.isRequired,
  setDeviceLocation: PropTypes.func.isRequired,
  deviceLocation: PropTypes.string,
};

export default AuxiliarySetupLocationPage;
