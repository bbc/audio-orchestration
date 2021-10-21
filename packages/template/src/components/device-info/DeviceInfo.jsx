/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';
import config from 'config';

const controlDescription = (controlId) => {
  const control = config.CONTROLS.find((c) => c.controlId === controlId);
  if (!control) {
    return `${controlId} (undefined)`;
  }
  return `${control.controlName} (${control.controlType})`;
};

const DeviceInfo = ({
  ownDeviceId,
  currentContentId,
  connectedDevices,
  objectAllocations,
  controlAllocations,
}) => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <p>
        <Button onClick={() => setOpen(true)} content="Show detailed device status" />
      </p>
    );
  }

  return (
    <div className="device-info">
      <p><Button content="Close detailed device status" onClick={() => setOpen(false)} /></p>
      <p>{`Current sequence ID: ${currentContentId}`}</p>
      { connectedDevices.map(({
        deviceId,
        deviceControls,
        deviceIsMain,
        deviceType,
        deviceCurrentNumber,
        deviceJoiningNumber,
      }) => (
        <div key={deviceId} className="device">
          <h3>
            <Icon size="small" name={deviceType} />
            {` ${deviceCurrentNumber}. ${deviceType}, ${deviceIsMain ? 'main' : 'aux'} device (joining number:  ${deviceJoiningNumber})${deviceId === ownDeviceId ? ' (this device)' : ''}`}
          </h3>
          <ul>
            <li>{`DeviceId: ${deviceId}`}</li>
            <li>Control values on this device</li>
            <ul>
              { deviceControls.map(({ controlId, controlValues }) => (
                <li key={controlId}>{`${controlDescription(controlId)}: ${controlValues.join(', ')}`}</li>
              ))}
            </ul>
            <li>Objects allocated to this device</li>
            <ul>
              {objectAllocations[deviceId].map(({ objectId, objectGain }) => (
                <li key={objectId}>{`${objectId} (gain = ${objectGain})`}</li>
              ))}
            </ul>
            <li>Controls allocated to this device</li>
            <ul>
              {controlAllocations[deviceId].map(({ controlId }) => (
                <li key={controlId}>{`${controlId}`}</li>
              ))}
            </ul>
          </ul>
        </div>
      ))}
    </div>
  );
};

DeviceInfo.propTypes = {
  ownDeviceId: PropTypes.string.isRequired,
  objectAllocations: PropTypes.objectOf( // indexed by deviceId
    PropTypes.arrayOf( // object allocation objects
      PropTypes.shape({
        objectId: PropTypes.string.isRequired,
        objectGain: PropTypes.number.isRequired,
      }),
    ),
  ).isRequired,
  controlAllocations: PropTypes.objectOf( // indexed by deviceId
    PropTypes.arrayOf( // control allocation objects
      PropTypes.shape({
        controlId: PropTypes.string.isRequired,
      }),
    ),
  ).isRequired,
  connectedDevices: PropTypes.arrayOf( // device objects
    PropTypes.shape({
      deviceId: PropTypes.string.isRequired,
      deviceType: PropTypes.string.isRequired,
      deviceControls: PropTypes.arrayOf( // device control objects
        PropTypes.shape({
          controlId: PropTypes.string.isRequired,
          controlValues: PropTypes.arrayOf( // selected control values
            PropTypes.any,
          ).isRequired,
        }),
      ).isRequired,
      deviceIsMain: PropTypes.bool.isRequired,
      deviceJoiningNumber: PropTypes.number.isRequired,
      deviceCurrentNumber: PropTypes.number.isRequired,
    }),
  ).isRequired,
  currentContentId: PropTypes.string.isRequired,
};

export default DeviceInfo;
