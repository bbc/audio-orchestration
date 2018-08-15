import React from 'react';
import PropTypes from 'prop-types';

import MasterDisconnected from './master-disconnected';
import MasterEnded from './master-ended';
import MasterPlaying from './master-playing';

const MasterPage = (props) => {
  const {
    connected,
    ended,
  } = props;

  if (!connected) {
    return <MasterDisconnected {...props} />;
  }

  if (ended) {
    return <MasterEnded {...props} />;
  }

  return <MasterPlaying {...props} />;
};

MasterPage.propTypes = {
  connected: PropTypes.bool.isRequired,
  ended: PropTypes.bool.isRequired,
};

export default MasterPage;
