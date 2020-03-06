import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import config from '../../config';
import Button from '../../components/button/Button';
import PageFiller from '../../components/page-filler/PageFiller';
import PageContents from '../../components/page-contents/PageContents';
import PlayerImage from '../../components/player-image/PlayerImage';
import PlayerTitle from '../../components/player-title/PlayerTitle';

import {
  startSession,
  joinSession,
} from '../../template/actions';

// TODO putting this here to ensure it is in click event, should probably be in sagas.js instead.
import { ensureAudioContext } from '../../template/orchestration';

const StartPage = ({
  onClickStart,
  onClickJoin,
}) => (
  <div className={classnames('page', 'page-start')}>
    <PageContents>
      <PlayerImage src={config.PLAYER_IMAGE_URL} />
      <PlayerTitle title={config.TEXT_TITLE} subtitle={config.TEXT_SUBTITLE} />

      <p>
        {config.TEXT_INTRODUCTION}
      </p>

      <PageFiller />

      <p>
        <Button
          content={config.TEXT_START_LABEL}
          onClick={onClickStart}
          fluid
        />
      </p>
      <p>
        <Button
          content={config.TEXT_JOIN_LABEL}
          onClick={onClickJoin}
          fluid
        />
      </p>
    </PageContents>
  </div>
);

StartPage.propTypes = {
  onClickStart: PropTypes.func.isRequired,
  onClickJoin: PropTypes.func.isRequired,
};

// TODO may not need any state on start page.
const mapStateToProps = () => ({});

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

export default connect(mapStateToProps, mapDispatchToProps)(StartPage);
