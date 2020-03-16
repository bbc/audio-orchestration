import { connect } from 'react-redux';
import {
  requestPlay,
  requestPause,
  requestSeek,
} from 'actions';
import PlayerControls from './PlayerControls';

const mapStateToProps = ({
  contentDuration,
  contentSpeed,
  contentCorrelation,
  loop,
  canPause,
  canSeek,
}) => ({
  correlation: contentCorrelation,
  duration: contentDuration,
  speed: contentSpeed,
  loop,
  canPause,
  canSeek,
});

const mapDispatchToProps = (dispatch) => ({
  onPlay: () => dispatch(requestPlay()),
  onPause: () => dispatch(requestPause()),
  onSeek: (seekOffset) => dispatch(requestSeek(seekOffset)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayerControls);
