import React from 'react';
import PropTypes from 'prop-types';

const ErrorPage = ({ errorMessage }) => (
  <div className="page page-error">
    <h1>
      Error
    </h1>

    <p>
      { errorMessage }
    </p>
  </div>
);

ErrorPage.defaultProps = {
  errorMessage: 'An unspecified error occured.',
};

ErrorPage.propTypes = {
  errorMessage: PropTypes.string,
};

export default ErrorPage;
