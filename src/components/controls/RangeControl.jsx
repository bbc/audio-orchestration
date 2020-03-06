import React from 'react';
import PropTypes from 'prop-types';

import Input from '../input/Input';

const RadioControl = ({
  parameters,
  currentValues,
  onChangeControl,
}) => {
  const {
    min,
    max,
    step,
  } = parameters;

  const currentValue = currentValues[0];

  const handleChange = (value) => {
    // TODO rate-limit it here, e.g. only submit after 300ms without input?
    onChangeControl([parseFloat(value, 10)]);
  };

  return (
    <p>
      <Input
        type="range"
        value={currentValue}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleChange(e.target.value)}
        fluid
      />
    </p>
  );
};

RadioControl.propTypes = {
  parameters: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    step: PropTypes.number.isRequired,
  }).isRequired,
  currentValues: PropTypes.arrayOf(
    PropTypes.number,
  ).isRequired,
  onChangeControl: PropTypes.func.isRequired,
};

export default RadioControl;
