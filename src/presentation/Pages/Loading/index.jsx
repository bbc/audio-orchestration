import React from 'react';
import PropTypes from 'prop-types';

const Loading = ({
  loadingMessage,
}) => (
  <div className="page page-loading">
    <h1>
      Loading&hellip;
    </h1>
    <p>
      {loadingMessage}
    </p>
  </div>
);

Loading.defaultProps = {
  loadingMessage: 'Preparing...',
};

Loading.propTypes = {
  loadingMessage: PropTypes.string,
};

export default Loading;
