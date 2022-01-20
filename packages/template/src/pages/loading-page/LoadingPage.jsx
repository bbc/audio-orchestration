/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames';
import PageFiller from 'components/page-filler/PageFiller';
import PageContents from 'components/page-contents/PageContents';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import Icon from 'components/icon/Icon';

const LoadingPage = () => (
  <div className={classnames('page', 'page-start', 'page-with-status-bar')}>
    <ConnectedStatusBar />

    <PageContents>
      <PageFiller />
      <p style={{ textAlign: 'center' }}>
        <Icon name="loading" loading size="large" />
      </p>
      <PageFiller />
    </PageContents>
  </div>
);

LoadingPage.propTypes = {};

export default LoadingPage;
