/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import {
  requestPlay,
  requestPause,
  requestSeek,
  requestTransitionToSequence,
  requestToggleCalibrationMode,
} from 'actions';
import { ROLE_MAIN } from 'sagas';
import PlayerControls from './PlayerControls';

// Set to true to show a replay button at the end of the sequence. This will be shown in place of
// the play button and only if it is the last sequence, or the 'hold' flag is set so there is no
// automatic transition.
// You may have different requirements for setting the replayContentId, or may only want to enable
// this for certain sequences.
const enableReplayButton = false;

const mapStateToProps = ({
  canPause,
  canSeek,
  currentContentId,
  role,
}) => ({
  canPause,
  canSeek,
  replayContentId: enableReplayButton ? currentContentId : undefined,
  isMain: role === ROLE_MAIN,
});

const mapDispatchToProps = (dispatch) => ({
  onPlay: () => dispatch(requestPlay()),
  onPause: () => dispatch(requestPause()),
  onSeek: (seekOffset) => dispatch(requestSeek(seekOffset)),
  onTransitionToSequence: (contentId) => dispatch(requestTransitionToSequence(contentId)),
  onEnterCalibrationMode: () => dispatch(requestToggleCalibrationMode(true)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayerControls);
