import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  selectGetCurrentTime,
} from 'selectors';
import formatTime from './formatTime';

const PlayerProgressText = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const getCurrentTime = useSelector(selectGetCurrentTime);
  const duration = useSelector((state) => state.contentDuration);
  const speed = useSelector((state) => state.contentSpeed);

  useEffect(() => {
    let interval = null;

    const update = () => {
      setCurrentTime(getCurrentTime());
    };

    update();

    if (speed !== 0) {
      interval = setInterval(update, 100);
    }

    return () => {
      window.clearInterval(interval);
    };
  }, [getCurrentTime]);

  return (
    <div className="player-controls-progress-text">
      {`${formatTime(currentTime)}/${formatTime(duration)}`}
    </div>
  );
};

export default PlayerProgressText;
