/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const InstructionsSessionCode = ({
  sessionCode,
}) => (
  <div>
    <h1 className={classnames('instructions-session-code')}>
      {`${sessionCode.slice(0, sessionCode.length / 2)} ${sessionCode.slice(sessionCode.length / 2)}`}
    </h1>
  </div>
);

InstructionsSessionCode.propTypes = {
  sessionCode: PropTypes.string,
};

InstructionsSessionCode.defaultProps = {
  sessionCode: undefined,
};

export default InstructionsSessionCode;
