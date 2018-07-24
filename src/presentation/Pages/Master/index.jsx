import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';

class MasterPage extends React.Component {
  render() {
    const {
      sessionCode,
      connectedDeviceTypes,
      play,
      pause,
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
          <button type="button" onClick={play}>
            Play
          </button>
          <button type="button" onClick={pause}>
            Pause
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
};

export default MasterPage;
