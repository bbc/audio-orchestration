import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';

const PlayerButton = ({
  type,
  onClick,
  className,
}) => (
  <Button
    className={classnames(
      'player-controls-button',
      type,
      className,
    )}
    icon
    onClick={onClick}
  >
    <Icon name={type} size="small" className="player-controls-button-icon" />
    <Icon name={type} size="small" className="player-controls-button-icon-hover" />
  </Button>
);

PlayerButton.propTypes = {
  /* which icon to use; e.g. play, pause */
  type: PropTypes.string.isRequired,
  /* click handler */
  onClick: PropTypes.func.isRequired,
  /* additional classes to apply to the button */
  className: PropTypes.string,
};

PlayerButton.defaultProps = {
  className: undefined,
};

export default PlayerButton;
