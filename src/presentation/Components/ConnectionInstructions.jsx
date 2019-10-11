import React from 'react';
import PropTypes from 'prop-types';
import SessionCode from './SessionCode';
import QRCodeContainer from './QRCodeContainer';

const ConnectionInstructions = ({
  sessionCode,
  baseUrl,
}) => (
  <div>
    <p>
      {'Visit '}
      <code>{baseUrl || window.location.href}</code>
      {' on all your devices, and join with the session code: '}
      <SessionCode sessionCode={sessionCode} />
      .
    </p>
    <QRCodeContainer url={`${baseUrl}/${sessionCode}`} />
  </div>
);

ConnectionInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
  baseUrl: PropTypes.string.isRequired,
};

export default ConnectionInstructions;
