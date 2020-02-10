import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

const Loading = ({
  loadingMessages,
}) => (
  <div className="page page-loading">
    <h1>
      Loading&hellip;
    </h1>
    <div>
      { loadingMessages.map((m) => (
        <p key={m} className="loading-message-log">
          {m}
        </p>
      ))}
    </div>
    <StepProgressIndicator step={2} numSteps={3} />
  </div>
);

Loading.defaultProps = {
  loadingMessages: ['Preparing'],
};

Loading.propTypes = {
  loadingMessages: PropTypes.arrayOf(PropTypes.string),
};

export default Loading;
