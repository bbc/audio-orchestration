import React from 'react';
import PropTypes from 'prop-types';

const ConnectionInstructions = ({
  sessionCode,
}) => (
  <p>
    QR code and short URL go here. Visit this page on all your devices, and join with this code:
    { ' ' }
    <b>
      {sessionCode}
    </b>
    .
  </p>
);

ConnectionInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
};

export default ConnectionInstructions;
