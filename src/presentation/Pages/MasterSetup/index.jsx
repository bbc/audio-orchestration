import React from 'react';
import StepProgressIndicator from '../../Components/StepProgressIndicator';

const MasterSetupPage = () => (
  <div className="page page-master">
    <h1>
      Master Setup
    </h1>
    <StepProgressIndicator step={3} numSteps={3} />
  </div>
);

export default MasterSetupPage;
