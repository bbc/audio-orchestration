import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from './ToggleButton';
import config from '../../config';

const DeviceControlSelection = ({
  value,
  onChange,
}) => (
  <div>
    <p>
      { config.TEMPLATE_CONTROL_OPTIONS.map(v => (
        <ToggleButton
          onClick={() => onChange(v)}
          text={v}
          selected={value === v}
          key={v}
        />
      ))
      }
    </p>
  </div>
);

DeviceControlSelection.defaultProps = {
  value: null,
};

DeviceControlSelection.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default DeviceControlSelection;
