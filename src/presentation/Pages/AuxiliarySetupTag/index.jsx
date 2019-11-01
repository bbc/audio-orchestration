import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import DeviceTagSelection from '../../Components/DeviceTagSelection';

const AuxiliarySetupTagPage = ({
  auxiliaryTagOnClose,
  setDeviceTag,
  deviceTemplateTag,
}) => (
  <div className="page page-auxiliary-setup-tag">
    <h1>
      Device Setup
    </h1>

    <p>Select an option below.</p>

    <DeviceTagSelection
      tag={deviceTemplateTag}
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
  deviceTemplateTag: null,
};

AuxiliarySetupTagPage.propTypes = {
  auxiliaryTagOnClose: PropTypes.func.isRequired,
  setDeviceTag: PropTypes.func.isRequired,
  deviceTemplateTag: PropTypes.string,
};

export default AuxiliarySetupTagPage;
