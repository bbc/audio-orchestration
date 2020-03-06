import { connect } from 'react-redux';
import Controls from './Controls';

import {
  requestSetControlValues,
} from '../../template/actions';

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
