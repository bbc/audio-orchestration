import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import getCurrentTime from './getCurrentTime';
import formatTime from './formatTime';

const PlayerProgressText = ({
  correlation,
  speed,
  duration,
  loop,
}) => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let interval = null;

    const update = () => {
      setCurrentTime(getCurrentTime(correlation, speed, duration, loop));
    };

    update();

    if (speed !== 0) {
      interval = setInterval(update, 100);
    }

    return () => {
      window.clearInterval(interval);
    };
  }, [setCurrentTime, correlation, speed]);

  return (
    <div className="player-controls-progress-text">
      {`${formatTime(currentTime)}/${formatTime(duration)}`}
    </div>
  );
};

PlayerProgressText.propTypes = {
  /* Correlation defining the relation between the media time (childTime) and the current
   * Date.now() time (parentTime). */
  correlation: PropTypes.shape({
    parentTime: PropTypes.number.isRequired,
    childTime: PropTypes.number.isRequired,
  }).isRequired,
  /* Current playback speed, 0 if paused/1 if playing normally. */
  speed: PropTypes.number.isRequired,
  /* The total duration of the current media, in seconds. */
  duration: PropTypes.number.isRequired,
  /* Whether the media is playing in a loop. */
  loop: PropTypes.bool,
};

PlayerProgressText.defaultProps = {
  loop: false,
};

export default PlayerProgressText;
