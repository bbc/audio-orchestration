/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import PageContents from 'components/page-contents/PageContents';
import MainDeviceCalibration from 'components/calibration/MainDeviceCalibration';
import AuxDeviceCalibration from 'components/calibration/AuxDeviceCalibration';

const CalibrationPage = () => {
  const isMain = useSelector((state) => state.isMain);
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
