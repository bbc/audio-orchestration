import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import DeviceList from '../../Components/DeviceList';
import LargeButton from '../../Components/LargeButton';

import { JOIN_URL } from '../../../config';

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
          {`${sessionCode.slice(0, sessionCode.length / 2)} ${sessionCode.slice(sessionCode.length / 2)}`}
        </b>
        .
      </p>

      <Player {...props} />

      { (sequenceEnded && sequenceHold) || sequenceSkippable
        ? sequenceNext.map(({ contentId, label }) => (
          <p key={`${contentId}-${label}`}>
            <LargeButton text={label} onClick={() => transitionToSequence(contentId)} />
          </p>
        ))
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
  transitionToSequence: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sequenceSkippable: PropTypes.bool.isRequired,
  sequenceHold: PropTypes.bool.isRequired,
  sequenceEnded: PropTypes.bool.isRequired,
  sequenceNext: PropTypes.arrayOf(PropTypes.shape({
    contentId: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
};

export default MainPlayingPage;
