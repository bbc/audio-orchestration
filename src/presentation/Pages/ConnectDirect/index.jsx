import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';

const ConnectDirectPage = ({
  joinDirect,
}) => (
  <div className="page page-connect-direct">
    <h1>
      ConnectDirect
    </h1>
    <p>
      <LargeButton
        text="Join"
        onClick={joinDirect}
      />
    </p>
    <StepProgressIndicator step={1} numSteps={3} />
  </div>
);

export default ConnectDirectPage;
