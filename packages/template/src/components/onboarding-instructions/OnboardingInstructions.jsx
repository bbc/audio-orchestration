/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import QRCode from 'components/qr-code/QRCode';
import ConnectedDeviceList from 'components/device-list/ConnectedDeviceList';
import Share from 'components/share/Share';
import config from 'config';

const OnboardingInstructions = ({
  sessionCode,
}) => {
  const joinSessionUrl = `${config.JOIN_URL}/${sessionCode}`;

  return (
    <div className="onboarding-instructions">
      <h2>{config.TEXT_ONBOARDING_TITLE}</h2>

      <QRCode url={joinSessionUrl} />

      <p>
        <Share url={joinSessionUrl} small />
      </p>

      <p className="hide-on-small">
        {config.TEXT_ONBOARDING_DESCRIPTION}
      </p>

      <ConnectedDeviceList className="hide-on-small" />
    </div>
  );
};

OnboardingInstructions.propTypes = {
  sessionCode: PropTypes.string.isRequired,
};

const mapStateToProps = ({
  sessionCode,
}) => ({
  sessionCode,
});

export default connect(mapStateToProps)(OnboardingInstructions);
