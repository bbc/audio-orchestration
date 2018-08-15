import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

const StartPage = ({
  startSession,
  joinSession,
}) => (
  <div className="page page-start">
    <h1>
      bbcat-orchestration-template
    </h1>

    <p>
      You can modify these components, and the main.scss stylesheet, to customise the
      interface.
    </p>

    <p>
      <LargeButton
        text="Create Session"
        secondaryText="Start on the device with the best speakers."
        onClick={startSession}
      />
    </p>
    <p>
      <LargeButton
        text="Join"
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
