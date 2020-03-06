import { connect } from 'react-redux';
import StatusBar from './StatusBar';
import { ROLE_MAIN } from '../../sagas';

// TODO import action to open instructions page
// import { } from '../../template/actions';

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
