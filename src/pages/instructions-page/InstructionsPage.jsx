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

import {
  closeInstructions,
} from 'actions';

const InstructionsPage = ({
  connected,
  onClose,
  sessionCode,
}) => {
  const joinSessionUrl = connected ? `${config.JOIN_URL}/${sessionCode}` : config.JOIN_URL;

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
};

InstructionsPage.defaultProps = {
  connected: false,
  sessionCode: undefined,
};

const mapStateToProps = ({
  connected,
  sessionCode,
}) => ({
  connected,
  sessionCode,
});

const mapDispatchToProps = (dispatch) => ({
  onClose: () => dispatch(closeInstructions()),
});

export default connect(mapStateToProps, mapDispatchToProps)(InstructionsPage);
