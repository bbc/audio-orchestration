import React from 'react';
import PropTypes from 'prop-types';

const LoadingModal = ({ loading }) => (
  <div className={`modal modal-loading ${loading ? 'modal-visible' : ''}`}>
    <h1>
      Loading
    </h1>
  </div>
);

LoadingModal.propTypes = {
  loading: PropTypes.bool.isRequired,
};

export default LoadingModal;
