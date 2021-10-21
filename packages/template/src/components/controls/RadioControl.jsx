/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import Input from 'components/input/Input';

const RadioControl = ({
  parameters,
  currentValues,
  onChangeControl,
}) => {
  const { options } = parameters;

  const handleChange = (value, checked) => {
    if (checked) {
      onChangeControl([value]);
    }
  };

  return (
    <ul className="controls-radio-control-list">
      { options.map(({ value, label }) => (
        <li key={`${value}-${label}`}>
          <label>
            <Input
              type="radio"
              checked={currentValues.includes(value)}
              onChange={(e) => handleChange(value, e.target.checked)}
            />
            {label}
          </label>
        </li>
      ))}
    </ul>
  );
};

RadioControl.propTypes = {
  parameters: PropTypes.shape({
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })).isRequired,
  }).isRequired,
  currentValues: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ).isRequired,
  onChangeControl: PropTypes.func.isRequired,
};

export default RadioControl;
