import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { ROLE_MAIN } from 'sagas';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import PageContents from 'components/page-contents/PageContents';
import MainDeviceCalibration from 'components/calibration/MainDeviceCalibration';
import AuxDeviceCalibration from 'components/calibration/AuxDeviceCalibration';

const CalibrationPage = () => {
  const isMain = useSelector((state) => state.role) === ROLE_MAIN;
  const globalCalibrationState = useSelector((state) => state.globalCalibrationState);
  const localCalibrationState = useSelector((state) => state.localCalibrationState);

  return (
    <div className={classnames('page', 'page-calibration', 'page-with-status-bar', 'page-device-calibration')}>
      <ConnectedStatusBar />
      <PageContents>
        <h1>Calibrate devices</h1>
        { isMain
          ? (
            <MainDeviceCalibration
              globalCalibrationState={globalCalibrationState}
              localCalibrationState={localCalibrationState}
            />
          ) : (
            <AuxDeviceCalibration
              globalCalibrationState={globalCalibrationState}
              localCalibrationState={localCalibrationState}
            />
          ) }
      </PageContents>
    </div>
  );
};

export default CalibrationPage;
