import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  selectIsNearEnd,
  selectEnableCalibration,
} from 'selectors';
import PlayerButton from './PlayerButton';
import PlayerProgressBar from './PlayerProgressBar';
import PlayerProgressText from './PlayerProgressText';

const PlayerControls = ({
  canPause,
  canSeek,
  onTransitionToSequence,
  replayContentId,
  className,
  onPlay,
  onPause,
  onSeek,
  isMain,
  onEnterCalibrationMode,
}) => {
  const isPlaying = useSelector((state) => state.contentSpeed > 0);
  const isNearEnd = useSelector(selectIsNearEnd);
  const enableCalibration = useSelector(selectEnableCalibration);

  const showReplay = !!replayContentId && isNearEnd && onTransitionToSequence;
  const showCalibrationButton = !isMain && !isNearEnd && enableCalibration;

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
        canSeek={canSeek}
        onSeek={onSeek}
      />
      <div className="player-controls-buttons">
        {playButton}
        { showCalibrationButton && <PlayerButton type="metronome" title="Calibration mode" onClick={onEnterCalibrationMode} />}
      </div>
      <PlayerProgressText />
    </div>
  );
};

PlayerControls.propTypes = {
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
  /* Whether this is the main device */
  isMain: PropTypes.bool.isRequired,
  /* Event handler for requestion to open calibration mode */
  onEnterCalibrationMode: PropTypes.func.isRequired,
};

PlayerControls.defaultProps = {
  className: undefined,
  onPlay: undefined,
  onPause: undefined,
  onSeek: undefined,
  onTransitionToSequence: undefined,
  replayContentId: undefined,
};

export default PlayerControls;
