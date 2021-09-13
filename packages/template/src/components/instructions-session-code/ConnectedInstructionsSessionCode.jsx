import { connect } from 'react-redux';
import InstructionsSessionCode from './InstructionsSessionCode';

const mapStateToProps = ({
  sessionCode,
}) => ({
  sessionCode,
});

export default connect(mapStateToProps, null)(InstructionsSessionCode);
