import React from 'react';
import PropTypes from 'prop-types';

const LinkButton = (props) => {
  const {
    text,
    onClick,
    disabled,
  } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="link-button"
    >
      { text }
    </button>
  );
};

LinkButton.defaultProps = {
  disabled: false,
  onClick: () => {},
};

LinkButton.propTypes = {
  text: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default LinkButton;
