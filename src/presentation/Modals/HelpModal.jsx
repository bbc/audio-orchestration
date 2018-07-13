import React from 'react';
import PropTypes from 'prop-types';

const HelpModal = ({ visible }) => (
  <div className={`modal modal-help ${!visible ? 'modal-hidden' : ''}`}>
    <h1>
      Help
    </h1>

    <p>
      This explains how you can connect your devices.
    </p>
  </div>
);

HelpModal.defaultProps = {
  visible: false,
};

HelpModal.propTypes = {
  visible: PropTypes.bool,
};

export default HelpModal;
