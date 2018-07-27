import React from 'react';
import PropTypes from 'prop-types';

import SlaveDisconnected from './slave-disconnected';
import SlaveEnded from './slave-ended';
import SlavePlaying from './slave-playing';

const SlavePage = (props) => {
  const {
    connected,
    ended,
  } = props;

  if (!connected) {
    return <SlaveDisconnected {...props} />;
  }

  if (ended) {
    return <SlaveEnded {...props} />;
  }

  return <SlavePlaying {...props} />;
};

SlavePage.propTypes = {
  connected: PropTypes.bool.isRequired,
  ended: PropTypes.bool.isRequired,
};

export default SlavePage;
