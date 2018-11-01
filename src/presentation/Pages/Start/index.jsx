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
      Orchestration template
    </h1>

    <p>
      This is the starting page.
    </p>

    <p>
      { 'You can replace the text in these components by editing the '}
      <code>JSX</code>
      { ' files in the '}
      <code>src/presentation/</code>
      { ' directory, and change the colour scheme by editing '}
      <code>colours.scss</code>
      .
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
