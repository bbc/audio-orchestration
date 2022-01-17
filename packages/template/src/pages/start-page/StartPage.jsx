/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import config from 'config';
import Button from 'components/button/Button';
import PageFiller from 'components/page-filler/PageFiller';
import PageContents from 'components/page-contents/PageContents';
import PlayerImage from 'components/player-image/PlayerImage';
import PlayerTitle from 'components/player-title/PlayerTitle';

import {
  startSession,
  joinSession,
} from 'actions';

import { acquireWakeLock } from 'sagas';
import { ensureAudioContext } from '../../template/orchestration';

const StartPage = ({
  onClickStart,
  onClickJoin,
}) => (
  <div className={classnames('page', 'page-start')}>
    <PageContents>
      <PlayerImage
        image={{
          src: config.LANDING_IMAGE_URL || config.PLAYER_IMAGE_URL,
          alt: config.LANDING_IMAGE_ALT || config.PLAYER_IMAGE_ALT,
        }}
        className="player-image-start-page"
      />
      <PlayerTitle title={config.TEXT_TITLE} subtitle={config.TEXT_SUBTITLE}>
        <p>
          {config.TEXT_INTRODUCTION}
        </p>
      </PlayerTitle>

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

const mapDispatchToProps = (dispatch) => ({
  onClickStart: () => {
    acquireWakeLock();
    ensureAudioContext();
    dispatch(startSession());
  },
  onClickJoin: () => {
    acquireWakeLock();
    ensureAudioContext();
    dispatch(joinSession());
  },
});

export default connect(null, mapDispatchToProps)(StartPage);
