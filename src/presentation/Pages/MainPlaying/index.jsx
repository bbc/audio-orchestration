import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import DeviceList from '../../Components/DeviceList';
import LargeButton from '../../Components/LargeButton';
import SessionCode from '../../Components/SessionCode';

import config from '../../../config';

const MainPlayingPage = (props) => {
  const {
    transitionToSequence,
    sessionCode,
    connectedDevices,
    activeObjectIds,
    sequenceEnded,
    sequenceSkippable,
    sequenceHold,
    sequenceNext,
    controlsOnOpen,
  } = props;

  return (
    <div className="page page-main">
      <h1>
        Main Device
      </h1>

      <p>
        This is the main device. Join with code
        {' '}
        <SessionCode sessionCode={sessionCode} />
        .
      </p>

      <Player {...props} />

      { (sequenceEnded && sequenceHold) || sequenceSkippable
        ? sequenceNext.map(({ contentId, label }) => (
          <p key={`${contentId}-${label}`}>
            <LargeButton text={label} onClick={() => transitionToSequence(contentId)} />
          </p>
        ))
        : null}

      <p>
        <LargeButton
          text="Change main device controls"
          onClick={() => controlsOnOpen()}
        />
      </p>

      <DeviceList
        showInstructions
        devices={connectedDevices}
        baseUrl={config.JOIN_URL}
        sessionCode={sessionCode}
      />

      <ObjectList objectIds={activeObjectIds} />
    </div>
  );
};

MainPlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  transitionToSequence: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sequenceSkippable: PropTypes.bool.isRequired,
  sequenceHold: PropTypes.bool.isRequired,
  sequenceEnded: PropTypes.bool.isRequired,
  sequenceNext: PropTypes.arrayOf(PropTypes.shape({
    contentId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  controlsOnOpen: PropTypes.func.isRequired,
};

export default MainPlayingPage;
