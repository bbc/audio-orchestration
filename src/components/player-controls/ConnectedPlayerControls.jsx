import { connect } from 'react-redux';
import PlayerControls from './PlayerControls';
import {
  requestPlay,
  requestPause,
  requestSeek,
} from '../../template/actions';

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
