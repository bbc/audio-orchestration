import React from 'react';
import PropTypes from 'prop-types';
import ToggleButton from './ToggleButton';

const LocationSetting = ({
  distance,
  direction,
  onChange,
}) => (
  <div>
    <p>
      <ToggleButton
        onClick={() => onChange({ distance: 'near' })}
        text="Near"
        selected={distance === 'near'}
      />
      <ToggleButton
        onClick={() => onChange({ distance: 'far' })}
        text="Far"
        selected={distance === 'far'}
      />
    </p>
    <p>
      <ToggleButton
        onClick={() => onChange({ direction: 'front' })}
        text="Front"
        selected={direction === 'front'}
      />
      <ToggleButton
        onClick={() => onChange({ direction: 'side' })}
        text="Side"
        selected={direction === 'side'}
      />
      <ToggleButton
        onClick={() => onChange({ direction: 'rear' })}
        text="Rear"
        selected={direction === 'rear'}
      />
    </p>
  </div>
);

LocationSetting.defaultProps = {
  distance: '',
  direction: '',
};

LocationSetting.propTypes = {
  distance: PropTypes.string,
  direction: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default LocationSetting;
