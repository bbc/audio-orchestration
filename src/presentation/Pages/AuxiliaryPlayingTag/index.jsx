import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import DeviceTagSelection from '../../Components/DeviceTagSelection';

const AuxiliaryPlayingTagPage = ({
  auxiliaryTagOnClose,
  setDeviceTag,
  deviceTemplateTag,
}) => (
  <div className="page page-auxiliary-playing-tag">
    <h1>
      Device Settings
    </h1>

    <p>Select an option below.</p>

    <DeviceTagSelection
      tag={deviceTemplateTag}
      onChange={tag => setDeviceTag(tag)}
    />

    <LargeButton
      text="Close"
      secondaryText="Return to the player."
      onClick={() => auxiliaryTagOnClose()}
    />
  </div>
);

AuxiliaryPlayingTagPage.defaultProps = {
  deviceTemplateTag: null,
};

AuxiliaryPlayingTagPage.propTypes = {
  auxiliaryTagOnClose: PropTypes.func.isRequired,
  setDeviceTag: PropTypes.func.isRequired,
  deviceTemplateTag: PropTypes.string,
};

export default AuxiliaryPlayingTagPage;
