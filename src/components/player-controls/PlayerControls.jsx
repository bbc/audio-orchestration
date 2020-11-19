import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PlayerButton from './PlayerButton';
import PlayerProgressBar from './PlayerProgressBar';
import PlayerProgressText from './PlayerProgressText';
import getCurrentTime from './getCurrentTime';

const PlayerControls = ({
  correlation,
  duration,
  speed,
  loop,
  canPause,
  canSeek,
  onTransitionToSequence,
  replayContentId,
  className,
  onPlay,
  onPause,
  onSeek,
}) => {
  const isPlaying = speed > 0;
  const isNearEnd = getCurrentTime(correlation, speed, duration, loop) >= duration - 0.1;
  const showReplay = !!replayContentId && isNearEnd && onTransitionToSequence;

  let playButton = null;

  if (canPause) {
    if (isPlaying) {
      // Pause (currently playing and can pause)
      playButton = <PlayerButton type="pause" title="Pause" onClick={onPause} />;
    } else if (!showReplay) {
      // Play (currently paused and cannot replay)
      playButton = <PlayerButton type="play" title="Play" disabled={isNearEnd} onClick={onPlay} />;
    } else {
      // Replay (currently paused and should show replay)
      playButton = <PlayerButton type="replay" title="Replay" onClick={() => onTransitionToSequence(replayContentId)} />;
    }
  }

  return (
    <div
      className={classnames(
        'player-controls',
        className,
      )}
    >
      <PlayerProgressBar
        correlation={correlation}
        speed={speed}
        duration={duration}
        loop={loop}
        canSeek={canSeek}
        onSeek={onSeek}
      />
      <div className="player-controls-buttons">
        {playButton}
      </div>
      <PlayerProgressText
        correlation={correlation}
        speed={speed}
        duration={duration}
        loop={loop}
      />
    </div>
  );
};

PlayerControls.propTypes = {
  /* Correlation defining the relation between the media time (childTime) and the current
   * Date.now() time (parentTime). */
  correlation: PropTypes.shape({
    parentTime: PropTypes.number.isRequired,
    childTime: PropTypes.number.isRequired,
  }).isRequired,
  /* The total duration of the current media, in seconds. */
  duration: PropTypes.number.isRequired,
  /* The current playback speed (1.0 for playing; 0 for paused). */
  speed: PropTypes.number.isRequired,
  /* Whether the current media is playing in a loop. */
  loop: PropTypes.bool,
  /* Whether this player can play/pause */
  canPause: PropTypes.bool.isRequired,
  /* Whether this player can seek */
  canSeek: PropTypes.bool.isRequired,
  /* Additional class names for the player controls container div. */
  className: PropTypes.string,
  /* Event handler for the play button (if not set, play button will not show). */
  onPlay: PropTypes.func,
  /* Event handler for the pause button (if not set, pause button will not show). */
  onPause: PropTypes.func,
  /* Event handler for seeking on the progress bar (if not set, playhead will not show). */
  onSeek: PropTypes.func,
  /* Event handler for requesting a sequence transition. */
  onTransitionToSequence: PropTypes.func,
  /* contentId to transition to on clicking the replay button (if not set, it is not shown). */
  replayContentId: PropTypes.string,
};

PlayerControls.defaultProps = {
  className: undefined,
  onPlay: undefined,
  onPause: undefined,
  onSeek: undefined,
  loop: false,
  onTransitionToSequence: undefined,
  replayContentId: undefined,
};

export default PlayerControls;
