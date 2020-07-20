import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';

import config from 'config';
import PageOverflow from 'components/page-overflow/PageOverflow';
import PageContents from 'components/page-contents/PageContents';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import PlayerImage from 'components/player-image/PlayerImage';
import PlayerTitle from 'components/player-title/PlayerTitle';
import ConnectedPlayerControls from 'components/player-controls/ConnectedPlayerControls';
import ConnectedChoices from 'components/choices/ConnectedChoices';
import ConnectedControls from 'components/controls/ConnectedControls';
import ConnectedObjectList from 'components/object-list/ConnectedObjectList';

import {
  startSession,
  joinSession,
} from 'actions';

// TODO putting this here to ensure it is in click event, should probably be in sagas.js instead.
import { ensureAudioContext } from '../../template/orchestration';

const PlayingPage = ({
  // Get activeControlIds from state
  activeControlIds,
}) => (
  <div className={classnames('page', 'page-playing', 'page-with-status-bar')}>
    <ConnectedStatusBar instructions />

    <PageContents>
      <PlayerImage src={config.PLAYER_IMAGE_URL} alt={config.TEXT_PLAYER_IMAGE_ALT} />
      <PlayerTitle title={config.TEXT_TITLE} subtitle={config.TEXT_SUBTITLE} />
      <ConnectedPlayerControls />

      <ConnectedChoices />

      { config.DEBUG_UI ? <ConnectedObjectList /> : null }

      { activeControlIds.length > 0
        ? (
          <PageOverflow>
            <ConnectedControls controls={config.CONTROLS} />
          </PageOverflow>
        ) : null }

    </PageContents>
  </div>
);

PlayingPage.propTypes = {
  activeControlIds: PropTypes.arrayOf(
    PropTypes.string,
  ).isRequired,
};

const mapStateToProps = ({
  // state
  activeControlIds,
}) => ({
  activeControlIds,
});

const mapDispatchToProps = (dispatch) => ({
  onClickStart: () => {
    ensureAudioContext();
    dispatch(startSession());
  },
  onClickJoin: () => {
    ensureAudioContext();
    dispatch(joinSession());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayingPage);
