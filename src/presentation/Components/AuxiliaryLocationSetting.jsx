import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from './ToggleButton';
import config from '../../config';

const LocationSetting = ({
  location,
  onChange,
}) => (
  <div>
    <p>
      { config.DEVICE_TAGS.map(({ name, friendlyName }) => (
        <ToggleButton
          onClick={() => onChange(name)}
          text={friendlyName}
          selected={location === name}
          key={name}
        />
      ))
      }
    </p>
  </div>
);

LocationSetting.defaultProps = {
  location: null,
};

LocationSetting.propTypes = {
  location: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default LocationSetting;
