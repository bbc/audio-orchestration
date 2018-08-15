import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

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
    <StepProgressIndicator step={2} numSteps={3} />
  </div>
);

Loading.defaultProps = {
  loadingMessage: 'Preparing...',
};

Loading.propTypes = {
  loadingMessage: PropTypes.string,
};

export default Loading;
