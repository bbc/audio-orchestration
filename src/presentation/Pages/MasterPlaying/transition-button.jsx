import React from 'react';
import PropTypes from 'prop-types';

import LargeButton from '../../Components/LargeButton';

const TransitionButton = ({
  current,
  from,
  to,
  transition,
  text,
}) => {
  if (current === from) {
    return (
      <LargeButton
        text={text}
        onClick={() => {
          console.log('transition', to);
          transition(to);
        }}
      />);
  }
  return null;
};

TransitionButton.defaultProps = {
  text: 'Continue',
};

TransitionButton.propTypes = {
  current: PropTypes.string.isRequired,
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  transition: PropTypes.func.isRequired,
  text: PropTypes.string,
};

export default TransitionButton;
