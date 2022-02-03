/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Button = ({
  content,
  disabled,
  fluid,
  className,
  onClick,
  children,
  icon,
  title,
}) => (
  <button
    type="button"
    className={classnames(
      'button',
      className,
      {
        'accent-colour-background': !icon,
        disabled,
        fluid,
        icon,
      },
    )}
    disabled={disabled}
    onClick={onClick}
    title={title}
  >
    {children || content}
  </button>
);

Button.propTypes = {
  /* The visible content of the button */
  content: PropTypes.string,
  /* Whether the button is disabled or not */
  disabled: PropTypes.bool,
  /* Any additional class names to use on this button */
  className: PropTypes.string,
  /* A click handler */
  onClick: PropTypes.func,
  /* Wether the button is fluid (taking up all available horizontal space) or not */
  fluid: PropTypes.bool,
  /* If the button has child nodes, these are rendered instead of the content prop. */
  children: PropTypes.node,
  /* Whether the button is an icon (supply an <Icon /> as a child) - no background, less padding */
  icon: PropTypes.bool,
  /* Title text describing the button; for icon buttons */
  title: PropTypes.string,
};

Button.defaultProps = {
  content: undefined,
  disabled: false,
  className: undefined,
  onClick: undefined,
  fluid: false,
  children: undefined,
  icon: false,
  title: undefined,
};

export default Button;
