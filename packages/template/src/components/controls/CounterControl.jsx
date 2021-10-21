/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Button from 'components/button/Button';

const CounterControl = ({
  parameters,
  currentValues,
  onChangeControl,
}) => {
  const { step, label } = parameters;

  const handleClick = () => {
    onChangeControl([currentValues[0] + step]);
  };

  return (
    <p>
      <Button onClick={handleClick} content={label} fluid />
    </p>
  );
};

CounterControl.propTypes = {
  parameters: PropTypes.shape({
    step: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  currentValues: PropTypes.arrayOf(
    PropTypes.number,
  ).isRequired,
  onChangeControl: PropTypes.func.isRequired,
};

export default CounterControl;
