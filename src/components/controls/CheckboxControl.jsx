import React from 'react';
import PropTypes from 'prop-types';

import Input from '../input/Input';

const CheckboxControl = ({
  parameters,
  currentValues,
  onChangeControl,
}) => {
  const { options } = parameters;

  const handleChange = (value, checked) => {
    if (!checked) {
      // unchecked, remove from current values
      onChangeControl(currentValues.filter((v) => v !== value));
    } else {
      // checked, add to current values (but remove it first to so it's only in there once)
      onChangeControl([...currentValues.filter((v) => v !== value), value]);
    }
  };

  return (
    <ul className="controls-checkbox-control-list">
      { options.map(({ value, label }) => (
        <li key={`${value}-${label}`}>
          <label>
            <Input
              type="checkbox"
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

CheckboxControl.propTypes = {
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

export default CheckboxControl;
