import { connect } from 'react-redux';
import { ROLE_MAIN } from 'sagas';
import {
  openInstructions,
  closeInstructions,
} from 'actions';
import StatusBar from './StatusBar';

const mapStateToProps = ({
  // state
  sessionCode,
  connected,
  connectedDevices,
  role,
}, {
  // ownProps
  instructions,
  instructionsOpen,
  className,
}) => ({
  sessionCode,
  connected,
  numDevices: connectedDevices.length,
  isMain: role === ROLE_MAIN,
  instructions,
  instructionsOpen,
  className,
});

// TODO dispatch action to open instructions
const mapDispatchToProps = (dispatch) => ({
  onOpenInstructions: () => dispatch(openInstructions()),
  onCloseInstructions: () => dispatch(closeInstructions()),
});

export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);
