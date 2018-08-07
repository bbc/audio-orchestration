import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import TransitionButton from './transition-button';

import {
  SEQUENCE_LOOP,
  SEQUENCE_MAIN,
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
        Master Device
      </h1>

      <p>
        { `Join with code ${sessionCode}` }
      </p>

      <Player {...props} />

      <TransitionButton
        current={currentContentId}
        from={SEQUENCE_LOOP}
        to={SEQUENCE_MAIN}
        transition={transitionToSequence}
      />

      <p>
        Objects:

        { activeObjectIds.map(objectId => (
          <span key={objectId} style={{ display: 'inline-block', margin: '4px' }}>
            {`${objectId}`}
          </span>
        ))}
      </p>

      <p>
        Devices:
      </p>

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
