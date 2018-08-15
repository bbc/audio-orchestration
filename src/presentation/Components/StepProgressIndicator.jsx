import React from 'react';
import PropTypes from 'prop-types';

const StepProgressIndicator = (props) => {
  const {
    step,
    numSteps,
  } = props;
  return (
    <p style={{ textAlign: 'center' }}>
      { `${' X '.repeat(step)}${' O '.repeat(numSteps - step)}` }
    </p>
  );
};

StepProgressIndicator.propTypes = {
  step: PropTypes.number.isRequired,
  numSteps: PropTypes.number.isRequired,
};

export default StepProgressIndicator;
