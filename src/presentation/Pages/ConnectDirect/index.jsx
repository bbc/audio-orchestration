import React from 'react';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

const ConnectDirectPage = () => (
  <div className="page page-connect-direct">
    <h1>
      ConnectDirect
    </h1>
    <StepProgressIndicator step={1} numSteps={3} />
  </div>
);

export default ConnectDirectPage;
