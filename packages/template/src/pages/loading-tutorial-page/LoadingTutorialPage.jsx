import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import PageContents from 'components/page-contents/PageContents';
import PageFiller from 'components/page-filler/PageFiller';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import Button from 'components/button/Button';

import {
  loadingTutorialContinue,
} from 'actions';

// TODO make a TutorialStep component?
const LoadingTutorialPage = ({
  connected,
  onContinue,
}) => (
  <div className={classnames('page', 'page-loading-tutorial', 'page-with-status-bar')}>
    <ConnectedStatusBar instructions={connected} />

    <PageContents>
      <h2>1. Connect devices</h2>
      <p>&hellip;</p>

      <h2>2. Set controls</h2>
      <p>&hellip;</p>

      <h2>3. Listen and make choices</h2>
      <p>&hellip;</p>

      <PageFiller />
      <p>
        { connected
          ? <Button content="Got it" onClick={onContinue} fluid />
          : <Button disabled content="waiting until connected&hellip;" fluid />}
      </p>
    </PageContents>
  </div>
);

LoadingTutorialPage.propTypes = {
  connected: PropTypes.bool,
  onContinue: PropTypes.func.isRequired,
};

LoadingTutorialPage.defaultProps = {
  connected: false,
};

const mapStateToProps = ({
  connected,
}) => ({
  connected,
});

const mapDispatchToProps = (dispatch) => ({
  onContinue: () => dispatch(loadingTutorialContinue()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoadingTutorialPage);
