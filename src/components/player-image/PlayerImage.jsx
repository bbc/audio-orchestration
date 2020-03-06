import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const PlayerImage = ({
  src,
  alt,
  className,
}) => (
  <div
    className={classnames(
      'player-image',
      className,
    )}
  >
    { src
      ? <img src={src} alt={alt} className={classnames('player-image-image')} width="600" height="600" />
      : <div className={classnames('player-image-placeholder')} />}
  </div>
);

PlayerImage.propTypes = {
  /* Link to an image file. This should be a square image of at least 600x600 pixels */
  src: PropTypes.string,
  /* Alt text describing the image */
  alt: PropTypes.string,
  /* Any additional class names to use on the container div */
  className: PropTypes.string,
};

PlayerImage.defaultProps = {
  src: undefined,
  alt: undefined,
  className: undefined,
};

export default PlayerImage;
