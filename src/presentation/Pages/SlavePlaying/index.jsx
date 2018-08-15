import React from 'react';
import PropTypes from 'prop-types';

import Player from '../../Components/Player';
import ObjectList from '../../Components/ObjectList';
import LinkButton from '../../Components/LinkButton';
import { CONTENT_ID_MAIN } from '../../../config';

const SlavePlayingPage = (props) => {
  const {
    sessionCode,
    activeObjectIds,
    slaveLocationOnOpen,
    currentContentId,
  } = props;

  return (
    <div className="page page-master">
      <h1>
        Slave Device
      </h1>

      <p>
        This is a slave device. Join with code
        {' '}
        <b>
          {sessionCode}
        </b>
        .
      </p>

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
        <LinkButton
          text="Change Device Location"
          onClick={() => slaveLocationOnOpen()}
        />
      </p>

      <ObjectList objectIds={activeObjectIds} />
    </div>
  );
};

SlavePlayingPage.propTypes = {
  connectedDevices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string.isRequired,
  currentContentId: PropTypes.string.isRequired,
  slaveLocationOnOpen: PropTypes.func.isRequired,
  activeObjectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default SlavePlayingPage;
