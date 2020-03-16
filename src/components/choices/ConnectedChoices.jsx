import { connect } from 'react-redux';
import { ROLE_MAIN } from 'sagas'; // TODO set isMain in state to avoid these imports
import { requestTransitionToSequence } from 'actions';
import Choices from './Choices';

const mapStateToProps = ({
  sequenceChoices,
  role,
  sequenceEnded,
  sequenceSkippable,
  sequenceHold,
}) => {
  const displayChoices = (role === ROLE_MAIN)
    && ((sequenceEnded && sequenceHold) || sequenceSkippable);

  return {
    choices: displayChoices ? sequenceChoices || [] : [],
  };
};

const mapDispatchToProps = (dispatch) => ({
  onSelectChoice: (contentId) => dispatch(requestTransitionToSequence(contentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Choices);
