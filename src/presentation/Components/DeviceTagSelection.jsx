import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from './ToggleButton';
import config from '../../config';

const DeviceTagSelection = ({
  tag,
  onChange,
}) => (
  <div>
    <p>
      { config.DEVICE_TAGS.map(({ name, friendlyName }) => (
        <ToggleButton
          onClick={() => onChange(name)}
          text={friendlyName}
          selected={tag === name}
          key={name}
        />
      ))
      }
    </p>
  </div>
);

DeviceTagSelection.defaultProps = {
  tag: null,
};

DeviceTagSelection.propTypes = {
  tag: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default DeviceTagSelection;
