import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';

const StartChoice = ({
  startSession,
  joinSession,
}) => (
  <div className="page page-start">
    <div className="gel-layout">
      <div className="gel-1/1">
        <h1>
          bbcat-orchestration-template
        </h1>

        <p>
          You can modify these components, and the main.scss stylesheet, to customise the
          interface.
        </p>
      </div>
    </div>

    <div className="gel-layout">
      <div className="gel-1/1">
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
      </div>
    </div>
  </div>
);

StartChoice.propTypes = {
  startSession: PropTypes.func.isRequired,
  joinSession: PropTypes.func.isRequired,
};

export default StartChoice;
