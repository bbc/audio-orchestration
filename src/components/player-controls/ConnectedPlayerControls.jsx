import { connect } from 'react-redux';
import {
  requestPlay,
  requestPause,
  requestSeek,
  requestTransitionToSequence,
} from 'actions';
import PlayerControls from './PlayerControls';

// Set to true to show a replay button at the end of the sequence. This will be shown in place of
// the play button and only if it is the last sequence, or the 'hold' flag is set so there is no
// automatic transition.
// You may have different requirements for setting the replayContentId, or may only want to enable
// this for certain sequences.
const enableReplayButton = false;

const mapStateToProps = ({
  contentDuration,
  contentSpeed,
  contentCorrelation,
  loop,
  canPause,
  canSeek,
  currentContentId,
}) => ({
  correlation: contentCorrelation,
  duration: contentDuration,
  speed: contentSpeed,
  loop,
  canPause,
  canSeek,
  replayContentId: enableReplayButton ? currentContentId : undefined,
});

const mapDispatchToProps = (dispatch) => ({
  onPlay: () => dispatch(requestPlay()),
  onPause: () => dispatch(requestPause()),
  onSeek: (seekOffset) => dispatch(requestSeek(seekOffset)),
  onTransitionToSequence: (contentId) => dispatch(requestTransitionToSequence(contentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayerControls);
