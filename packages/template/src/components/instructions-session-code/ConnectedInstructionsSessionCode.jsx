/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import InstructionsSessionCode from './InstructionsSessionCode';

const mapStateToProps = ({
  sessionCode,
}) => ({
  sessionCode,
});

export default connect(mapStateToProps, null)(InstructionsSessionCode);
