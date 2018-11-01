import React from 'react';
import PropTypes from 'prop-types';

const ConnectionInstructions = ({
  sessionCode,
  baseUrl,
}) => (
  <p>
    { ' These are the connection instructions: go to ' }
    <code>{baseUrl}</code>
    { ' on all your devices, and use this code: ' }
    <b>
      {sessionCode}
    </b>
    .
  </p>
);

ConnectionInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
};

export default ConnectionInstructions;
