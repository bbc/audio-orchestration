import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import LargeButton from '../../Components/LargeButton';
import SessionCode from '../../Components/SessionCode';
import config from '../../../config';

const AuxiliaryPlayingPage = (props) => {
  const {
    sessionCode,
    activeObjectIds,
    controlsOnOpen,
  } = props;

  return (
    <div className="page page-auxiliary-playing">
      <h1>Auxiliary Device</h1>

      <p>
        { 'Connected to ' }
        <SessionCode sessionCode={sessionCode} />
        . Interact with the player on the main device.
      </p>

      <Player {...props} />

      <p>
        <LargeButton
          text="Change device controls"
          onClick={() => controlsOnOpen()}
        />
      </p>

      { config.DEBUG_UI
        ? (
          <ObjectList objectIds={activeObjectIds} />
        )
        : null}

    </div>
  );
};

AuxiliaryPlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  controlsOnOpen: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default AuxiliaryPlayingPage;
