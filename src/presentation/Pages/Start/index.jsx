import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import config from '../../../config';

const StartPage = ({
  startSession,
  joinSession,
}) => (
  <div className="page page-start">
    <h1>
      {config.TEXT_TITLE}
    </h1>

    <p>
      {config.TEXT_INTRODUCTION}
    </p>

    <p>
      <LargeButton
        text={config.TEXT_START_LABEL}
        secondaryText="Start on the device with the best speakers."
        onClick={startSession}
      />
    </p>
    <p>
      <LargeButton
        text={config.TEXT_JOIN_LABEL}
        secondaryText="Connect this device as an auxiliary speaker."
        onClick={joinSession}
      />
    </p>
    <StepProgressIndicator step={1} numSteps={3} />
  </div>
);

StartPage.propTypes = {
  startSession: PropTypes.func.isRequired,
  joinSession: PropTypes.func.isRequired,
};

export default StartPage;
