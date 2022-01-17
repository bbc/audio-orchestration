/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
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
  isMain,
}, {
  // ownProps
  instructions,
  instructionsOpen,
  className,
}) => ({
  sessionCode,
  connected,
  numDevices: connectedDevices.length,
  isMain,
  instructions,
  instructionsOpen,
  className,
});

const mapDispatchToProps = (dispatch) => ({
  onOpenInstructions: () => dispatch(openInstructions()),
  onCloseInstructions: () => dispatch(closeInstructions()),
});

export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);
