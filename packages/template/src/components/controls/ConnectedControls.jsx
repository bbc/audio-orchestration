/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import { requestSetControlValues } from 'actions';
import Controls from './Controls';

const mapStateToProps = ({
  // state
  activeControlIds,
  controlValues,
}, {
  // ownProps
  controls,
}) => ({
  controls: controls
    .filter(({ controlId }) => activeControlIds.includes(controlId))
    .map((control) => ({
      ...control,
      currentValues: controlValues[control.controlId],
    })),
});

const mapDispatchToProps = (dispatch) => ({
  onChangeControl: (controlId, values) => dispatch(
    requestSetControlValues({ [controlId]: values }),
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Controls);
