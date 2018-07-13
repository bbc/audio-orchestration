import React from 'react';
import PropTypes from 'prop-types';

const ErrorModal = ({ error, errorMessage }) => (
  <div className={`modal modal-error ${!error ? 'modal-hidden' : ''}`}>
    <h1>
      Error
    </h1>

    <p>
      { errorMessage }
    </p>
  </div>
);

ErrorModal.defaultProps = {
  errorMessage: 'An unspecified error occured.',
};

ErrorModal.propTypes = {
  error: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
};

export default ErrorModal;
