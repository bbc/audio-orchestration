import { connect } from 'react-redux';
import { ROLE_MAIN } from 'sagas'; // TODO set isMain in state to avoid these imports
import { requestTransitionToSequence } from 'actions';
import config from 'config';
import ThumbnailChoices from './ThumbnailChoices';

const mapStateToProps = ({
  sequenceChoices = [],
  role,
  sequenceEnded,
  sequenceSkippable,
  sequenceHold,
}) => {
  const displayChoices = (role === ROLE_MAIN)
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
        duration,
      } = sequence;

      return {
        ...choice,
        sequenceTitle,
        sequenceSubtitle,
        sequenceImage,
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
