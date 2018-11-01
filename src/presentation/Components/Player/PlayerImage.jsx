import React from 'react';
import PropTypes from 'prop-types';

const PlayerImage = ({
  image,
}) => (
  <div className="player-image-container">
    <div className={`player-image player-image-${image}`} />
  </div>
);

PlayerImage.propTypes = {
  image: PropTypes.string.isRequired,
};

export default PlayerImage;
