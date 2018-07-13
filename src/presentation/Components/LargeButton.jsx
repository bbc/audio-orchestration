import React from 'react';
import PropTypes from 'prop-types';

const LargeButton = (props) => {
  const {
    text,
    secondaryText,
    onClick,
    disabled,
  } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="large-button"
    >
      <h1>
        { text }
      </h1>
      <p>
        { secondaryText }
      </p>
    </button>
  );
};

LargeButton.defaultProps = {
  disabled: false,
  onClick: () => {},
  secondaryText: '',
};

LargeButton.propTypes = {
  text: PropTypes.string.isRequired,
  secondaryText: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default LargeButton;
