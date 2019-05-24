import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import LargeButton from '../../Components/LargeButton';
import { CONTENT_ID_MAIN, DEBUG_UI } from '../../../config';

const AuxiliaryPlayingPage = (props) => {
  const {
    sessionCode,
    activeObjectIds,
    auxiliaryLocationOnOpen,
    currentContentId,
    deviceLocation,
  } = props;

  return (
    <div className="page page-auxiliary-playing">
      <h1>Auxiliary Device</h1>

      <p>This is the auxiliary device playing page.</p>

      <p>
        { 'You are connected to ' }
        <b>{sessionCode}</b>
        .
      </p>

      { currentContentId !== CONTENT_ID_MAIN
        ? (
          <p>
            { 'Click continue on your main device to proceed when you\'re ready.' }
          </p>
        )
        : null
      }

      <Player {...props} />

      <p>
        <LargeButton
          text="Change Device Location"
          secondaryText={deviceLocation}
          onClick={() => auxiliaryLocationOnOpen()}
        />
      </p>

      { DEBUG_UI
        ? (
          <ObjectList objectIds={activeObjectIds} />
        )
        : null
      }

    </div>
  );
};

AuxiliaryPlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  auxiliaryLocationOnOpen: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  deviceLocation: PropTypes.string.isRequired,
};

export default AuxiliaryPlayingPage;
