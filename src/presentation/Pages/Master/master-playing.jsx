import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import TransitionButton from './transition-button';

import {
  CONTENT_ID_LOOP,
  CONTENT_ID_MAIN,
} from '../../../config';

const MasterPlaying = (props) => {
  const {
    sessionCode,
    connectedDevices,
    currentContentId,
    activeObjectIds,
    transitionToSequence,
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

      <TransitionButton
        current={currentContentId}
        from={CONTENT_ID_LOOP}
        to={CONTENT_ID_MAIN}
        transition={transitionToSequence}
      />

      <ObjectList objectIds={activeObjectIds} />

      <ul>
        { connectedDevices.map(({ deviceId, deviceType, deviceLocation }) => (
          <li key={deviceId}>
            {`${deviceType} (${deviceLocation})`}
          </li>
        ))}
      </ul>
    </div>
  );
};

MasterPlaying.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  transitionToSequence: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default MasterPlaying;
