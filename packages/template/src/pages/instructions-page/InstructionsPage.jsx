/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import PageContents from 'components/page-contents/PageContents';
import PageFiller from 'components/page-filler/PageFiller';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import Button from 'components/button/Button';
import QRCode from 'components/qr-code/QRCode';
import ConnectedDeviceList from 'components/device-list/ConnectedDeviceList';
import Share from 'components/share/Share';
import config from 'config';
import { closeInstructions, requestToggleCalibrationMode } from 'actions';
import { ROLE_MAIN } from 'sagas';

const InstructionsPage = ({
  connected,
  onClose,
  sessionCode,
  role,
  enterCalibrationMode,
  connectedDevices,
}) => {
  const joinSessionUrl = connected ? `${config.JOIN_URL}/${sessionCode}` : config.JOIN_URL;

  const isMain = role === ROLE_MAIN;

  return (
    <div className={classnames('page', 'page-instructions', 'page-with-status-bar')}>
      <ConnectedStatusBar instructionsOpen />

      <PageContents>
        <h1>Connect devices</h1>

        <p>
          Use this link to connect more phones, tablets, or laptops to enhance the audio experience.
        </p>

        <p>
          <Share url={joinSessionUrl} />
        </p>

        <QRCode url={joinSessionUrl} />

        <PageFiller />

        <ConnectedDeviceList />

        <PageFiller />

        {config.CALIBRATION_SEQUENCE_URL
          && (
            (isMain && connectedDevices.length > 1)
            || (!isMain && config.ALLOW_CALIBRATION_FROM_AUX)
          )
          && (
          <p>
            <Button content="Enter calibration mode" onClick={enterCalibrationMode} fluid />
          </p>
          )}

        <p>
          <Button content="Back" onClick={onClose} fluid />
        </p>
      </PageContents>
    </div>
  );
};

InstructionsPage.propTypes = {
  connected: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  sessionCode: PropTypes.string,
  role: PropTypes.string.isRequired,
  enterCalibrationMode: PropTypes.func.isRequired,
  connectedDevices: PropTypes.arrayOf(PropTypes.shape({
    /* The deviceId is a unique-in-the-session identifier for the device. */
    deviceId: PropTypes.string.isRequired,
    /* The deviceType should match an icon name, such as tv, desktop, laptop, mobile, tablet */
    deviceType: PropTypes.string.isRequired,
  })).isRequired,
};

InstructionsPage.defaultProps = {
  connected: false,
  sessionCode: undefined,
};

const mapStateToProps = ({
  connected,
  sessionCode,
  role,
  connectedDevices,
}) => ({
  connected,
  sessionCode,
  role,
  connectedDevices,
});

const mapDispatchToProps = (dispatch) => ({
  onClose: () => dispatch(closeInstructions()),
  enterCalibrationMode: () => dispatch(requestToggleCalibrationMode(true)),
});

export default connect(mapStateToProps, mapDispatchToProps)(InstructionsPage);
