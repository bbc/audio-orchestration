import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../button/Button';
import Icon from '../icon/Icon';

const StatusBar = ({
  sessionCode,
  connected,
  numDevices,
  instructions,
  onOpenInstructions,
  isMain,
  className,
}) => {
  // TODO review copy for different statuses
  let statusText = 'Waiting to connect...';

  if (connected) {
    if (isMain) {
      if (numDevices <= 1) {
        statusText = 'Tap to add devices.';
      } else {
        statusText = `${numDevices} devices connected.`;
      }
    } else {
      statusText = 'This device is connected to:';
    }
  }

  return (
    <div
      type="button"
      className={classnames(
        'status-bar',
        { connected },
        'accent-color-background',
        className,
      )}
    >
      <div className="status-bar-content">
        <div className="status-bar-left">
          { connected
            ? <Icon padded name="check" className="status-bar-loaded-icon" />
            : <Icon padded name="loading" loading />}
        </div>
        <div className="status-bar-middle">
          { statusText }
          <br />
          { connected
            ? (
              <b className="status-bar-session-code">
                {`${sessionCode.slice(0, sessionCode.length / 2)} ${sessionCode.slice(sessionCode.length / 2)}`}
              </b>
            )
            : null }
        </div>
        <div className="status-bar-right">
          { instructions
            ? (
              <Button icon onClick={onOpenInstructions} className="status-bar-button-instructions">
                <Icon title="connection instructions" name="plus" />
              </Button>
            ) : null }
        </div>
      </div>
    </div>
  );
};

StatusBar.propTypes = {
  sessionCode: PropTypes.string,
  connected: PropTypes.bool,
  numDevices: PropTypes.number,
  isMain: PropTypes.bool,
  onOpenInstructions: PropTypes.func,
  instructions: PropTypes.bool,
  className: PropTypes.string,
};

StatusBar.defaultProps = {
  sessionCode: undefined,
  connected: false,
  numDevices: 0,
  isMain: false,
  onOpenInstructions: undefined,
  instructions: false,
  className: undefined,
};

export default StatusBar;
