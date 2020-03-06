import React from 'react';
// import PropTypes from 'prop-types';
import classnames from 'classnames';
import PageFiller from '../../components/page-filler/PageFiller';
import PageContents from '../../components/page-contents/PageContents';
import Icon from '../../components/icon/Icon';

// TODO make an error icon
// TODO get error message from state
// TODO if applicable, show a retry button
// TODO perhaps use status bar in a disconnected/error state
// TODO make a centered Text component?

const LoadingPage = () => (
  <div className={classnames('page', 'page-start', 'page-with-status-bar')}>

    <PageContents>
      <PageFiller />
      <p style={{ textAlign: 'center' }}>
        <Icon name="cross" size="large" />
      </p>
      <p style={{ textAlign: 'center' }}>
        Sorry; there was an error. Please reload the page to try again.
      </p>
      <PageFiller />
    </PageContents>
  </div>
);

LoadingPage.propTypes = {};

export default LoadingPage;
