import React from 'react';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

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
import ConnectedDeviceInfo from 'components/device-info/ConnectedDeviceInfo';
import RatingPrompt from 'components/rating-prompt/RatingPrompt';
import { ROLE_MAIN } from 'sagas';

const PlayingPage = () => {
  const activeControlIds = useSelector((state) => state.activeControlIds);
  const currentContentId = useSelector((state) => state.currentContentId);
  const role = useSelector((state) => state.role);

  const isMain = role === ROLE_MAIN;
  const showRating = isMain && config.PROMPT_SEQUENCES.includes(currentContentId);

  return (
    <div className={classnames('page', 'page-playing', 'page-with-status-bar')}>
      <ConnectedStatusBar instructions />

      <PageContents>
        <PlayerImage src={config.PLAYER_IMAGE_URL} alt={config.TEXT_PLAYER_IMAGE_ALT}>
          { showRating && <RatingPrompt pilotId={config.PILOT_ID} /> }
        </PlayerImage>
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

        { config.DEVICE_DEBUG_UI ? <ConnectedDeviceInfo /> : null }
      </PageContents>
    </div>
  );
};

export default PlayingPage;
