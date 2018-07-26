import React from 'react';
import PropTypes from 'prop-types';

const ToggleButton = ({
  text,
  selected,
  onClick,
}) => (
  <button
    type="button"
    className={`toggle-button ${selected ? 'selected' : ''}`}
    onClick={onClick}
  >
    {text}
  </button>
);

ToggleButton.propTypes = {
  text: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,

};

export default ToggleButton;
