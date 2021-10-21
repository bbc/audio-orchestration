/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';
import CalibrationControls from 'components/calibration-controls/CalibrationControls';
import PageFiller from 'components/page-filler/PageFiller';
import config from 'config';
import {
  requestSetPlaybackOffset,
  requestStartCalibrationSession,
  requestEndCalibrationSession,
  requestToggleCalibrationMode,
} from 'actions';
import { GLOBAL_CALIBRATION_STATES, LOCAL_CALIBRATION_STATES } from '../../template/calibrationOrchestration';

const AuxDeviceCalibration = ({ globalCalibrationState, localCalibrationState }) => {
  const dispatch = useDispatch();

  const devicePlaybackOffset = useSelector((state) => state.devicePlaybackOffset);

  const [latency, setLatency] = useState(0);

  const finishButton = (
    <Button
      content="Apply"
      onClick={() => {
        dispatch(requestSetPlaybackOffset(latency));
        dispatch(requestEndCalibrationSession());
      }}
      fluid
    />
  );

  const startButton = (
    <Button
      content="Calibrate this device"
      onClick={() => { dispatch(requestStartCalibrationSession()); }}
      fluid
    />
  );

  const cancelButton = (
    <Button
      content="Discard"
      onClick={() => {
        dispatch(requestEndCalibrationSession());
      }}
      fluid
    />
  );

  const resetButton = (
    <Button
      content="Clear calibration"
      onClick={() => { dispatch(requestSetPlaybackOffset(0)); }}
      fluid
    />
  );

  const exitCalibrationButton = (
    <Button
      content="Exit calibration"
      onClick={() => {
        dispatch(requestToggleCalibrationMode(false));
      }}
      fluid
    />
  );

  let message = null;
  let button1 = null;
  let button2 = null;
  let button3 = null;

  if (globalCalibrationState === GLOBAL_CALIBRATION_STATES.ONGOING) {
    if (localCalibrationState === LOCAL_CALIBRATION_STATES.LOADING) {
      message = <p style={{ textAlign: 'center' }}><Icon name="loading" loading size="large" /></p>;
      button1 = finishButton;
      button2 = cancelButton;
    } else if (localCalibrationState === LOCAL_CALIBRATION_STATES.CONNECTED) {
      message = <CalibrationControls onChange={setLatency} />;
      button1 = finishButton;
      button2 = cancelButton;
    } else if (localCalibrationState === LOCAL_CALIBRATION_STATES.ERROR) {
      message = <p>There was an error during calibration. Please try again.</p>;
      button2 = cancelButton;
    } else {
      message = <p>Calibration ongoing...</p>;
    }
  } else {
    message = (
      <p>
        Click the button below to start calibration on this device.
        {devicePlaybackOffset !== 0 && (
        <>
          <br />
          <br />
          Currently calibrated to
          {' '}
          {(devicePlaybackOffset < 0) ? '−' : '+'}
          {Math.abs(devicePlaybackOffset)}
          {' '}
          ms.
        </>
        )}
      </p>
    );
    if (devicePlaybackOffset !== 0) button1 = resetButton;
    button2 = startButton;
    if (config.ALLOW_CALIBRATION_FROM_AUX) button3 = exitCalibrationButton;
  }

  return (
    <>
      {message}
      <PageFiller />
      {button1 && <p>{button1}</p>}
      {button2 && <p>{button2}</p>}
      {button3 && <p>{button3}</p>}
    </>
  );
};

AuxDeviceCalibration.propTypes = {
  globalCalibrationState: PropTypes.string.isRequired,
  localCalibrationState: PropTypes.string.isRequired,
};

export default AuxDeviceCalibration;
