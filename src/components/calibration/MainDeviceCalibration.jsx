import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import PageFiller from 'components/page-filler/PageFiller';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';
import { requestToggleCalibrationMode, requestEndCalibrationSession } from 'actions';
import { GLOBAL_CALIBRATION_STATES, LOCAL_CALIBRATION_STATES } from '../../template/calibrationOrchestration';

const MainDeviceCalibration = ({ globalCalibrationState, localCalibrationState }) => {
  const dispatch = useDispatch();

  const exitCalibrationButton = (
    <Button
      content="Exit calibration"
      onClick={() => {
        dispatch(requestToggleCalibrationMode(false));
      }}
      fluid
    />
  );

  const cancelCalibrationButton = (
    <Button
      content="Cancel calibration"
      onClick={() => { dispatch(requestEndCalibrationSession()); }}
      fluid
    />
  );

  let message = null;
  let button = null;

  if (globalCalibrationState === GLOBAL_CALIBRATION_STATES.ONGOING) {
    message = localCalibrationState === LOCAL_CALIBRATION_STATES.LOADING
      ? <Icon name="loading" loading size="large" />
      : 'Calibration ongoing. Use the button below to cancel the calibration.';
    button = cancelCalibrationButton;
  } else {
    message = localCalibrationState === LOCAL_CALIBRATION_STATES.ERROR
      ? 'There was an error while attempting to calibrate device'
      : (
        <>
          This is the main device. On each connected device, you&apos;ll see a button labelled
          {' '}
          <i>&quot;Calibrate this device&quot;</i>
          . Click to start the calibration process.
          <br />
          <br />
          Use the calibration tool if your devices are not in time with each other.
          Use the volume controls on each device to balance the levels as you would like.
        </>
      );
    button = exitCalibrationButton;
  }

  return (
    <>
      <p style={localCalibrationState === LOCAL_CALIBRATION_STATES.LOADING ? { textAlign: 'center' } : null}>{message}</p>
      <PageFiller />
      <p>{button}</p>
    </>
  );
};

MainDeviceCalibration.propTypes = {
  globalCalibrationState: PropTypes.string.isRequired,
  localCalibrationState: PropTypes.string.isRequired,
};

export default MainDeviceCalibration;
