import React from 'react';
import classnames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';

import config from 'config';
import PageOverflow from 'components/page-overflow/PageOverflow';
import PageContents from 'components/page-contents/PageContents';
import ConnectedStatusBar from 'components/status-bar/ConnectedStatusBar';
import PlayerImage from 'components/player-image/PlayerImage';
import PlayerTitle from 'components/player-title/PlayerTitle';
import ConnectedPlayerControls from 'components/player-controls/ConnectedPlayerControls';
import ConnectedChoices from 'components/choices/ConnectedChoices';
import ConnectedThumbnailChoices from 'components/thumbnail-choices/ConnectedThumbnailChoices';
import ConnectedControls from 'components/controls/ConnectedControls';
import ConnectedObjectList from 'components/object-list/ConnectedObjectList';
import ConnectedDeviceInfo from 'components/device-info/ConnectedDeviceInfo';
import RatingPrompt from 'components/rating-prompt/RatingPrompt';
import OnboardingInstructions from 'components/onboarding-instructions/OnboardingInstructions';
import OverlayPrompt from 'components/overlay-prompt/OverlayPrompt';
import Icon from 'components/icon/Icon';
import {
  selectIsNearEnd,
  selectEnableCalibration,
} from 'selectors';
import {
  requestToggleCalibrationMode,
} from 'actions';
import { ROLE_MAIN } from 'sagas';

const PlayingPage = () => {
  const activeControlIds = useSelector((state) => state.activeControlIds);
  const currentContentId = useSelector((state) => state.currentContentId);
  const role = useSelector((state) => state.role);
  const image = useSelector((state) => state.image);
  const isNearEnd = useSelector(selectIsNearEnd);
  const enableCalibration = useSelector(selectEnableCalibration);
  const dispatch = useDispatch();

  const enterCalibrationMode = () => dispatch(requestToggleCalibrationMode(true));

  const effect = image ? image.effect : null;

  const {
    sequenceImage,
    sequenceImageAlt,
    sequenceTitle,
    sequenceSubtitle,
    instructions,
  } = config.SEQUENCE_URLS.find(({ contentId }) => contentId === currentContentId) || {};

  const isMain = role === ROLE_MAIN;
  const showRating = isMain && config.PROMPT_SEQUENCES.includes(currentContentId);
  const showInstructions = isMain && instructions && !showRating;
  const showTitle = !showRating;
  const showCalibrationPrompt = enableCalibration && !isMain && !isNearEnd
    && !showInstructions && !showRating;

  let defaultImage = config.PLAYER_IMAGE_URL;
  let defaultImageAlt = config.PLAYER_IMAGE_ALT;

  let title = config.TEXT_TITLE;
  let subtitle = config.TEXT_SUBTITLE;

  if (sequenceImage) {
    defaultImage = sequenceImage;
    defaultImageAlt = sequenceImageAlt;
  }

  if (sequenceTitle) {
    title = sequenceTitle;
    subtitle = sequenceSubtitle;
  }

  const playerImage = {
    src: image ? image.src : defaultImage,
    alt: (image && image.src && image.alt) || defaultImageAlt,
  };

  const playerImageClassName = classnames({
    'player-image-with-gradient': showTitle,
    'player-image-with-vignette': !!effect,
  });

  return (
    <div className={classnames('page', 'page-playing', 'page-with-status-bar')}>
      <ConnectedStatusBar instructions />

      <PageContents>
        <PlayerImage
          image={playerImage}
          effect={effect}
          className={playerImageClassName}
        >
          { showRating && <RatingPrompt /> }
          { showInstructions && <OnboardingInstructions /> }

          { showCalibrationPrompt && (
            <OverlayPrompt
              promptId="calibration"
              iconComponent={<Icon name="metronome" title="Metronome" />}
              header="Out of sync?"
              content="Calibrate your device"
              onClick={enterCalibrationMode}
            />
          )}

        </PlayerImage>

        { showTitle && <PlayerTitle title={title} subtitle={subtitle} />}

        <ConnectedPlayerControls />

        <ConnectedChoices />

        <ConnectedThumbnailChoices />

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
