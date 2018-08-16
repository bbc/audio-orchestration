import React from 'react';
import PropTypes from 'prop-types';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import LargeButton from '../../Components/LargeButton';
import LinkButton from '../../Components/LinkButton';
import ConnectionInstructions from '../../Components/ConnectionInstructions';
import DeviceList from '../../Components/DeviceList';
import { JOIN_URL, CONTENT_ID_MAIN } from '../../../config';

const MasterSetupPage = ({
  masterSetupOnContinue,
  sessionCode,
  connectedDevices,
  transitionToSequence,
}) => {
  const onContinue = () => {
    transitionToSequence(CONTENT_ID_MAIN);
    masterSetupOnContinue();
  };

  return (
    <div className="page page-master">
      <h1>
        Master Setup
      </h1>

      <ConnectionInstructions
        sessionCode={sessionCode}
        baseUrl={JOIN_URL}
      />

      <DeviceList
        placeholderText="Add your devices and they will show up here"
        showInstructions={false}
        devices={connectedDevices}
      />

      { connectedDevices.length === 0
        ? ([
          <LargeButton
            key="main"
            text="Start"
            secondaryText="You haven't added any additional devices yet. It will sound better if you do."
            disabled
          />,
          <p key="alternative">
            <LinkButton
              key="alternative"
              onClick={onContinue}
              text="Continue listening in stereo without adding devices (you can add more later)"
            />
          </p>,
        ])
        : (
          <LargeButton
            text="Start"
            secondaryText="Proceed to the content once you've set up all your devices."
            onClick={onContinue}
          />
        )
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
