import { connect } from 'react-redux';
import { ROLE_MAIN } from 'sagas';
import StatusBar from './StatusBar';


// TODO import action to open instructions page
// import { } from 'actions';

const mapStateToProps = ({
  // state
  sessionCode,
  connected,
  connectedDevices,
  role,
}, {
  // ownProps
  instructions,
  className,
}) => ({
  sessionCode,
  connected,
  numDevices: connectedDevices.length,
  isMain: role === ROLE_MAIN,
  instructions,
  className,
});

// TODO dispatch action to open instructions
// const mapDispatchToProps = (dispatch) => ({
//   onOpenInstructions: () => {},
// });

export default connect(mapStateToProps, null)(StatusBar);
