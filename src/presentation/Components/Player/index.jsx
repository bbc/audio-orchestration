import React from 'react';
import PropTypes from 'prop-types';
import DurationClock from './duration-clock';
import { DEFAULT_IMAGE_URL } from '../../../config';

const Player = ({
  playing,
  muted,
  play,
  pause,
  mute,
  unmute,
  seek,
  canPause,
  canSeek,
  currentContentId,
  contentCorrelation,
  contentSpeed,
  contentDuration,
  loop,
  primaryObjectImageUrl,
  primaryObjectId,
}) => {
  const buttons = [];
  if (canPause) {
    buttons.push(
      <button key="play-pause" type="button" onClick={playing ? pause : play}>
        { playing ? 'Pause' : 'Play' }
      </button>,
    );
  }

  if (muted) {
    buttons.push(
      <button key="unmute" type="button" onClick={() => unmute()}>
        unmute
      </button>,
    );
  } else {
    buttons.push(
      <button key="mute" type="button" onClick={() => mute()}>
        mute
      </button>,
    );
  }

  if (canSeek) {
    // TODO: seek functionality should use absolute media times and use duration, contentId?
    buttons.push(
      <button key="seek-back" type="button" onClick={() => seek(-10.0)}>
        -10
      </button>,
      <button key="seek-forward" type="button" onClick={() => seek(10)}>
        +10
      </button>,
    );
  }

  return (
    <div className="player">
      <p className="player-image">
        <img src={primaryObjectImageUrl} width="400" height="400" alt={primaryObjectId} />
      </p>
      <p className="player-controls">
        { buttons }
      </p>
      <p>
        { currentContentId }
      </p>
      <p>
        <DurationClock
          correlation={contentCorrelation}
          speed={contentSpeed}
          duration={contentDuration}
          loop={loop}
        />
      </p>
    </div>
  );
};

Player.defaultProps = {
  primaryObjectImageUrl: DEFAULT_IMAGE_URL,
  primaryObjectId: '',
};

Player.propTypes = {
  play: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  mute: PropTypes.func.isRequired,
  unmute: PropTypes.func.isRequired,
  seek: PropTypes.func.isRequired,
  playing: PropTypes.bool.isRequired,
  loop: PropTypes.bool.isRequired,
  muted: PropTypes.bool.isRequired,
  canPause: PropTypes.bool.isRequired,
  canSeek: PropTypes.bool.isRequired,
  currentContentId: PropTypes.string.isRequired,
  contentCorrelation: PropTypes.objectOf(PropTypes.number).isRequired,
  contentSpeed: PropTypes.number.isRequired,
  contentDuration: PropTypes.number.isRequired,
  primaryObjectImageUrl: PropTypes.string,
  primaryObjectId: PropTypes.string,
};

export default Player;
