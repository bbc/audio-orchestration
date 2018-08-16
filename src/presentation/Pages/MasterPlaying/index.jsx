import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import DeviceList from '../../Components/DeviceList';
import LinkButton from '../../Components/LinkButton';

import { JOIN_URL } from '../../../config';

const MasterPlayingPage = (props) => {
  const {
    sessionCode,
    connectedDevices,
    activeObjectIds,
    playAgain,
    ended,
  } = props;

  return (
    <div className="page page-master">
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
            <LinkButton text="Play again" onClick={playAgain} />
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

MasterPlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  transitionToSequence: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playAgain: PropTypes.func.isRequired,
  ended: PropTypes.bool.isRequired,
};

export default MasterPlayingPage;
