/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const PlayerTitle = ({
  title,
  subtitle,
  className,
  children,
}) => (
  <div
    className={classnames(
      'player-title',
      className,
    )}
  >
    { title && <h1 className="player-title-title">{title}</h1> }
    { subtitle && <p className="player-title-meta">{subtitle}</p> }
    { children }
  </div>
);

PlayerTitle.propTypes = {
  /* The title for the content */
  title: PropTypes.string,
  /* An optional subtitle or metadata, such as an episode number */
  subtitle: PropTypes.string,
  /* Additional classes to apply to the container div */
  className: PropTypes.string,
  /* Additional elements to render in the container after the title */
  children: PropTypes.node,
};

PlayerTitle.defaultProps = {
  title: undefined,
  subtitle: undefined,
  className: undefined,
  children: null,
};

export default PlayerTitle;
