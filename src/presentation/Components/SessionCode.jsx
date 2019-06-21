import React from 'react';
import PropTypes from 'prop-types';

const SessionCode = ({
  sessionCode,
}) => (
  <b>
    {`${sessionCode.slice(0, sessionCode.length / 2)} ${sessionCode.slice(sessionCode.length / 2)}`}
  </b>
);

SessionCode.propTypes = {
  sessionCode: PropTypes.string.isRequired,
};

export default SessionCode;
