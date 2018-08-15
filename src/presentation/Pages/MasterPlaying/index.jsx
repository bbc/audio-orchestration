import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import DeviceList from '../../Components/DeviceList';

const MasterPlayingPage = (props) => {
  const {
    sessionCode,
    connectedDevices,
    activeObjectIds,
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

      <DeviceList
        showInstructions
        devices={connectedDevices}
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
};

export default MasterPlayingPage;
