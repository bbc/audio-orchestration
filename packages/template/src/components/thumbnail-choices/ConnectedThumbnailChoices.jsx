/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import { requestTransitionToSequence } from 'actions';
import config from 'config';
import ThumbnailChoices from './ThumbnailChoices';

const mapStateToProps = ({
  sequenceChoices = [],
  sequenceEnded,
  sequenceSkippable,
  sequenceHold,
  isMain,
}) => {
  const displayChoices = isMain
    && ((sequenceEnded && sequenceHold) || sequenceSkippable);

  // Only show choices in this block that have the thumbnail flag set, and get their metadata
  const augmentedChoices = sequenceChoices
    .filter(({ thumbnail }) => !!thumbnail)
    .map((choice) => {
      const sequence = config.SEQUENCE_URLS.find(({ contentId }) => contentId === choice.contentId);
      if (!sequence) {
        return choice;
      }

      const {
        sequenceTitle,
        sequenceSubtitle,
        sequenceImage,
        sequenceImageAlt,
        duration,
      } = sequence;

      return {
        ...choice,
        sequenceTitle,
        sequenceSubtitle,
        sequenceImage,
        sequenceImageAlt,
        duration,
      };
    });

  return {
    choices: displayChoices ? augmentedChoices || [] : [],
    sequenceEnded,
  };
};

const mapDispatchToProps = (dispatch) => ({
  onSelectChoice: (contentId) => dispatch(requestTransitionToSequence(contentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ThumbnailChoices);
