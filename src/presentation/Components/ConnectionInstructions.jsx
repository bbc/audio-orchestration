import React from 'react';
import PropTypes from 'prop-types';
import SessionCode from './SessionCode';

const ConnectionInstructions = ({
  sessionCode,
  baseUrl,
}) => (
  <p>
    { 'Visit ' }
    <code>{baseUrl || window.location.href}</code>
    { ' on all your devices, and join with the session code: ' }
    <SessionCode sessionCode={sessionCode} />
    .
  </p>
);

ConnectionInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
};

export default ConnectionInstructions;
