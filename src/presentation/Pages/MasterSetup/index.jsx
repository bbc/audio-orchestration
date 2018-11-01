import React from 'react';
import PropTypes from 'prop-types';
import Player from '../../Components/Player';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import LinkButton from '../../Components/LinkButton';
import ConnectionInstructions from '../../Components/ConnectionInstructions';
import DeviceList from '../../Components/DeviceList';
import { JOIN_URL, CONTENT_ID_MAIN } from '../../../config';

const MasterSetupPage = (props) => {
  const {
    masterSetupOnContinue,
    sessionCode,
    connectedDevices,
    transitionToSequence,
  } = props;

  const onContinue = () => {
    transitionToSequence(CONTENT_ID_MAIN);
    masterSetupOnContinue();
  };

  return (
    <div className="page page-master">
      <h1>
        Main Device Setup
      </h1>

      <p>This is the main device setup page.</p>


      <ConnectionInstructions
        sessionCode={sessionCode}
        baseUrl={JOIN_URL}
      />

      <Player {...props} />

      <DeviceList
        placeholderText="No devices added yet."
        showInstructions={false}
        devices={connectedDevices}
      />

      <LargeButton
        key="main"
        text="Continue"
        secondaryText="Proceed to the main sequence."
        disabled={connectedDevices.length === 0}
        onClick={masterSetupOnContinue}
      />

      { connectedDevices.length === 0
        ? ([
          <p key="alternative">
            <LinkButton
              key="alternative"
              onClick={onContinue}
              text="Continue without adding devices"
            />
          </p>,
        ])
        : null
      }

      <StepProgressIndicator step={3} numSteps={3} />
    </div>
  );
};

MasterSetupPage.propTypes = {
  masterSetupOnContinue: PropTypes.func.isRequired,
  transitionToSequence: PropTypes.func.isRequired,
  sessionCode: PropTypes.string.isRequired,
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
};

export default MasterSetupPage;
