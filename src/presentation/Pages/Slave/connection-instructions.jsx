import React from 'react';
import PropTypes from 'prop-types';

const ConnectionInstructions = ({
  sessionCode,
}) => (
  <p>
    {`Connected to ${sessionCode}.`}
  </p>
);

ConnectionInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
};

export default ConnectionInstructions;
