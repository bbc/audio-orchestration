import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Icon = ({
  name,
  size,
  loading,
  title,
  padded,
  className,
}) => (
  <i
    title={title}
    className={classnames(
      'icon',
      `bbcat-icon-${name}`,
      size,
      {
        loading,
        padded,
      },
      className,
    )}
  />
);

Icon.propTypes = {
  /* The name of the icon; must exist in icon font. */
  name: PropTypes.string.isRequired,
  /* The size of the icon to use, normal is 32px. */
  size: PropTypes.oneOf(['tiny', 'small', 'normal', 'large', 'huge']),
  /* Whether the icon should spin to indicate a loading state */
  loading: PropTypes.bool,
  /* A description of the icon's purpose if not accompanied by text */
  title: PropTypes.string,
  /* Whether the icon should be shown as a padded inline block (e.g. to match button size) */
  padded: PropTypes.bool,
  /* Additional classes to apply to the icon */
  className: PropTypes.string,
};

Icon.defaultProps = {
  size: 'normal',
  className: undefined,
  loading: false,
  title: undefined,
  padded: false,
};

export default Icon;
