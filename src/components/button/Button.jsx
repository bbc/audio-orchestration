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
};

Button.defaultProps = {
  content: undefined,
  disabled: false,
  className: undefined,
  onClick: undefined,
  fluid: false,
  children: undefined,
  icon: false,
};

export default Button;
