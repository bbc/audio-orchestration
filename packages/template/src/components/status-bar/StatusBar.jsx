/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';

const StatusBar = ({
  sessionCode,
  connected,
  numDevices,
  instructions,
  instructionsOpen,
  onOpenInstructions,
  onCloseInstructions,
  isMain,
  className,
}) => {
  const [lastNumDevices, setLastNumDevices] = useState(numDevices);
  const [animateDeviceIndicator, setAnimateDeviceIndicator] = useState(false);

  useEffect(() => {
    let timeout;

    if (numDevices !== lastNumDevices) {
      setLastNumDevices(numDevices);
      setAnimateDeviceIndicator(true);

      timeout = setTimeout(() => setAnimateDeviceIndicator(false), 1000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [numDevices]);

  let statusText = 'Waiting to connect...';

  if (instructionsOpen) {
    statusText = 'Click to close instructions.';
  } else if (connected) {
    if (isMain) {
      if (numDevices <= 1) {
        statusText = 'Click to add devices.';
      } else if (numDevices === 2) {
        // numDevices includes the main device, but here we show the number of _additional_ devices.
        statusText = '1 device connected.';
      } else {
        statusText = `${numDevices - 1} devices connected.`;
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
          <div className="status-bar-num-devices" title={`${numDevices} device${numDevices === 1 ? '' : 's'} connected`}>
            <Icon name="loudspeaker" size="normal" />
            { numDevices > 1 && (
              <span className={classnames({ 'status-bar-animated-device-indicator': animateDeviceIndicator })}>
                &times;
                { numDevices }
              </span>
            )}
          </div>
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
          { instructionsOpen
            ? (
              <Button icon title="Close instructions" onClick={onCloseInstructions} className="status-bar-button-instructions">
                <Icon name="cross" />
              </Button>
            ) : null }
          { instructions
            ? (
              <Button icon title="Open connection instructions" onClick={onOpenInstructions} className="status-bar-button-instructions">
                <Icon name="plus" />
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
  onCloseInstructions: PropTypes.func,
  instructions: PropTypes.bool,
  instructionsOpen: PropTypes.bool,
  className: PropTypes.string,
};

StatusBar.defaultProps = {
  sessionCode: undefined,
  connected: false,
  numDevices: 0,
  isMain: false,
  onOpenInstructions: undefined,
  onCloseInstructions: undefined,
  instructions: false,
  instructionsOpen: false,
  className: undefined,
};

export default StatusBar;
