import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import LargeButton from '../../Components/LargeButton';
import { CONTENT_ID_MAIN, DEBUG_UI } from '../../../config';

const SlavePlayingPage = (props) => {
  const {
    sessionCode,
    activeObjectIds,
    slaveLocationOnOpen,
    currentContentId,
    deviceLocation,
  } = props;

  return (
    <div className="page page-slave-playing">
      <Player {...props} />

      { currentContentId !== CONTENT_ID_MAIN
        ? (
          <p>
            Press start on your main device to begin listening.
          </p>
        )
        : null
      }

      <p>
        <LargeButton
          text="Change Device Location"
          secondaryText={`${deviceLocation.distance}-${deviceLocation.direction}`}
          onClick={() => slaveLocationOnOpen()}
        />
      </p>

      { DEBUG_UI
        ? (
          <ObjectList objectIds={activeObjectIds} />
        )
        : null
      }

      <p style={{ textAlign: 'center' }}>
        {`${sessionCode}`}
      </p>
    </div>
  );
};

SlavePlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  slaveLocationOnOpen: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  deviceLocation: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default SlavePlayingPage;
