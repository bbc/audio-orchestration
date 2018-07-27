import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';
import Player from '../../Components/Player';

const MasterPlaying = (props) => {
  const {
    sessionCode,
    connectedDeviceTypes,
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

      <ul>
        { connectedDeviceTypes.map(t => (
          <li>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
};

MasterPlaying.defaultProps = {
  sessionCode: '-'.repeat(SESSION_CODE_LENGTH),
};

MasterPlaying.propTypes = {
  connectedDeviceTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  sessionCode: PropTypes.string,
};

export default MasterPlaying;

