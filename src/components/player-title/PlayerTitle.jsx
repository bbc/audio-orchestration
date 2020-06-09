import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const PlayerTitle = ({
  title,
  subtitle,
  className,
}) => (
  <div
    className={classnames(
      'player-title',
      className,
    )}
  >
    { title && <h1 className="player-title-title">{title}</h1> }
    { subtitle && <p className="player-title-meta">{subtitle}</p> }
  </div>
);

PlayerTitle.propTypes = {
  /* The title for the content */
  title: PropTypes.string, // TODO may be better as 'content'
  /* An optional subtitle or metadata, such as an episode number */
  subtitle: PropTypes.string, // TODO rename; as it's presented as metadata
  /* Additional classes to apply to the container div */
  className: PropTypes.string,
};

PlayerTitle.defaultProps = {
  title: undefined,
  subtitle: undefined,
  className: undefined,
};

export default PlayerTitle;
