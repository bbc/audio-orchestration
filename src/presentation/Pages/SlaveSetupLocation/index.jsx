import React from 'react';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

const SlaveSetupLocationPage = () => (
  <div className="page page-slave-setup-location">
    <h1>
      Slave Setup Location
    </h1>
    <StepProgressIndicator step={3} numSteps={3} />
  </div>
);

export default SlaveSetupLocationPage;
