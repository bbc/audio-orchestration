import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import DeviceTagSelection from '../../Components/DeviceTagSelection';

const AuxiliarySetupTagPage = ({
  auxiliaryTagOnClose,
  setDeviceTag,
  deviceTag,
}) => (
  <div className="page page-auxiliary-setup-tag">
    <h1>
      Device Setup
    </h1>

    <p>Select an option below.</p>

    <DeviceTagSelection
      tag={deviceTag}
      onChange={tag => setDeviceTag(tag)}
    />

    <LargeButton
      text="Continue"
      onClick={() => auxiliaryTagOnClose()}
    />

    <StepProgressIndicator step={3} numSteps={3} />
  </div>
);

AuxiliarySetupTagPage.defaultProps = {
  deviceTag: null,
};

AuxiliarySetupTagPage.propTypes = {
  auxiliaryTagOnClose: PropTypes.func.isRequired,
  setDeviceTag: PropTypes.func.isRequired,
  deviceTag: PropTypes.string,
};

export default AuxiliarySetupTagPage;
