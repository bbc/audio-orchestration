import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import DeviceControlSelection from '../../Components/DeviceControlSelection';

const ControlsPage = ({
  controlsOnClose,
  setDeviceTemplateControlValue,
  deviceTemplateControlValue,
}) => (
  <div className="page page-controls">
    <h1>
      Device Settings
    </h1>

    <p>Select an option below.</p>

    <DeviceControlSelection
      value={deviceTemplateControlValue}
      onChange={value => setDeviceTemplateControlValue(value)}
    />

    <LargeButton
      text="Close"
      secondaryText="Return to the player."
      onClick={() => controlsOnClose()}
    />
  </div>
);

ControlsPage.defaultProps = {
  deviceTemplateControlValue: null,
};

ControlsPage.propTypes = {
  controlsOnClose: PropTypes.func.isRequired,
  setDeviceTemplateControlValue: PropTypes.func.isRequired,
  deviceTemplateControlValue: PropTypes.string,
};

export default ControlsPage;
