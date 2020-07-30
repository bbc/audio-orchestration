import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import config from 'config';
import Button from 'components/button/Button';
import PageFiller from 'components/page-filler/PageFiller';
import PageContents from 'components/page-contents/PageContents';
import { joinDirect } from 'actions';
import PlayerImage from 'components/player-image/PlayerImage';
import PlayerTitle from 'components/player-title/PlayerTitle';

// TODO putting this here to ensure it is in click event, should probably be in sagas.js instead.
import { acquireWakeLock } from 'sagas';
import { ensureAudioContext } from '../../template/orchestration';

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
      <PlayerImage src={config.PLAYER_IMAGE_URL} alt={config.TEXT_PLAYER_IMAGE_ALT} />
      <PlayerTitle />

      <p>
        <Button onClick={onJoinDirect} content="Connect" fluid />
      </p>

      <p>
        Clicking this button will connect you to an existing session so you can hear synchronised
        audio from this device.
      </p>

      <PageFiller />

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
  onJoinDirect: () => {
    acquireWakeLock();
    ensureAudioContext();
    dispatch(joinDirect());
  },
});

export default connect(null, mapDispatchToProps)(ConnectDirectPage);
