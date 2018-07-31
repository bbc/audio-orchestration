import React from 'react';
import PropTypes from 'prop-types';

const LoadingModal = ({ loading }) => (
  <div className={`modal modal-loading ${loading ? 'modal-visible' : ''}`}>
    <div className="gel-layout">
      <div className="gel-1/1">
        <h1>
          Loading
        </h1>
      </div>
    </div>
  </div>
);

LoadingModal.propTypes = {
  loading: PropTypes.bool.isRequired,
};

export default LoadingModal;
