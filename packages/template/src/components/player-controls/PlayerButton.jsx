/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';

const PlayerButton = ({
  type,
  title,
  onClick,
  className,
  disabled,
}) => (
  <Button
    className={classnames(
      'player-controls-button',
      type,
      className,
    )}
    icon
    onClick={onClick}
    title={title}
    disabled={disabled}
  >
    <Icon name={type} size="small" className="player-controls-button-icon" />
  </Button>
);

PlayerButton.propTypes = {
  /* which icon to use; e.g. play, pause */
  type: PropTypes.string.isRequired,
  /* click handler */
  onClick: PropTypes.func.isRequired,
  /* additional classes to apply to the button */
  className: PropTypes.string,
  /* whether the button is disabled */
  disabled: PropTypes.bool,
  /* tooltip title for the button */
  title: PropTypes.string,
};

PlayerButton.defaultProps = {
  className: undefined,
  disabled: false,
  title: undefined,
};

export default PlayerButton;
