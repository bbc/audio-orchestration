import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import DeviceList from '../../Components/DeviceList';
import LargeButton from '../../Components/LargeButton';

import { JOIN_URL } from '../../../config';

const MainPlayingPage = (props) => {
  const {
    sessionCode,
    connectedDevices,
    activeObjectIds,
    playAgain,
    ended,
  } = props;

  return (
    <div className="page page-main">
      <h1>
        Main Device
      </h1>

      <p>
        This is the main device. Join with code
        {' '}
        <b>
          {sessionCode}
        </b>
        .
      </p>

      <Player {...props} />

      { ended
        ? (
          <p>
            <LargeButton text="Play again" onClick={playAgain} />
          </p>
        )
        : null
      }

      <DeviceList
        showInstructions
        devices={connectedDevices}
        baseUrl={JOIN_URL}
        sessionCode={sessionCode}
      />

      <ObjectList objectIds={activeObjectIds} />
    </div>
  );
};

MainPlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  transitionToSequence: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playAgain: PropTypes.func.isRequired,
  ended: PropTypes.bool.isRequired,
};

export default MainPlayingPage;
