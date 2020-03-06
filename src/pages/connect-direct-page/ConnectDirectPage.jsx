import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import Button from '../../components/button/Button';
import PageFiller from '../../components/page-filler/PageFiller';
import PageContents from '../../components/page-contents/PageContents';

import {
  joinDirect,
} from '../../template/actions';

const ConnectDirectPage = ({
  onJoinDirect,
  // sessionCode,
}) => (
  <div
    className={classnames(
      'page',
      'page-connect-direct',
      // 'page-with-status-bar',
    )}
  >
    <PageContents>
      <h1>
        Connect your device
      </h1>

      <p>Click the button below to join the session and hear additional audio from this device.</p>

      <PageFiller />

      <p>
        <Button onClick={onJoinDirect} content="Connect" fluid />
      </p>
    </PageContents>
  </div>
);

ConnectDirectPage.propTypes = {
  onJoinDirect: PropTypes.func.isRequired,
  // sessionCode: PropTypes.string.isRequired,
};

// TODO: Display the sessionCode (but it is only saved to the state after connecting)
// const mapStateToProps = ({
//   sessionCode,
// }) => ({
//   sessionCode,
// });

const mapDispatchToProps = (dispatch) => ({
  onJoinDirect: () => dispatch(joinDirect()),
});

export default connect(null, mapDispatchToProps)(ConnectDirectPage);
