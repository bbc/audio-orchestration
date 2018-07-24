import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';

class MasterPage extends React.Component {
  render() {
    const {
      sessionCode,
      connectedDeviceTypes,
      playing,
      play,
      pause,
      mute,
      muted,
      seek,
    } = this.props;

    return (
      <div className="page page-master">
        <h1>
          Master Device
        </h1>

        <p>
          { `Join with code ${sessionCode}` }
        </p>

        <p>
          <button type="button" onClick={playing ? pause : play}>
            { playing ? 'Pause' : 'Play' }
          </button>
          <button type="button" onClick={() => mute(!muted)}>
            { muted ? 'unmute' : 'mute' }
          </button>
          <button type="button" onClick={() => seek(-10.0)}>
            -10
          </button>
          <button type="button" onClick={() => seek(10)}>
            +10
          </button>
        </p>

        <ul>
          { connectedDeviceTypes.map(t => (
            <li>
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

MasterPage.defaultProps = {
  sessionCode: '-'.repeat(SESSION_CODE_LENGTH),
};

MasterPage.propTypes = {
  connectedDeviceTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  sessionCode: PropTypes.string,
  playing: PropTypes.bool.isRequired,
  muted: PropTypes.bool.isRequired,
  play: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  mute: PropTypes.func.isRequired,
  seek: PropTypes.func.isRequired,
};

export default MasterPage;
