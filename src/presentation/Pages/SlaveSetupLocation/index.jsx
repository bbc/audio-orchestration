import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import LocationSetting from '../../Components/SlaveLocationSetting';

const SlaveSetupLocationPage = ({
  slaveLocationOnClose,
  setDeviceLocation,
  deviceLocation,
}) => (
  <div className="page page-slave-setup-location">
    <h1>
      Set Location
    </h1>

    <p>This is the auxiliary device setup location page.</p>

    <p>Select a location below.</p>

    <LocationSetting
      distance={deviceLocation.distance}
      direction={deviceLocation.direction}
      onChange={location => setDeviceLocation(location)}
    />

    <LargeButton
      text="Continue"
      secondaryText="Close the location page."
      disabled={!(deviceLocation.distance && deviceLocation.direction)}
      onClick={() => slaveLocationOnClose()}
    />

    <StepProgressIndicator step={3} numSteps={3} />
  </div>
);

SlaveSetupLocationPage.propTypes = {
  slaveLocationOnClose: PropTypes.func.isRequired,
  setDeviceLocation: PropTypes.func.isRequired,
  deviceLocation: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default SlaveSetupLocationPage;
