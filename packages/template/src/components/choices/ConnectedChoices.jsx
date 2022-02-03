/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import { connect } from 'react-redux';
import { requestTransitionToSequence } from 'actions';
import Choices from './Choices';

const mapStateToProps = ({
  sequenceChoices = [],
  isMain,
  sequenceEnded,
  sequenceSkippable,
  sequenceHold,
}) => {
  const displayChoices = isMain
    && ((sequenceEnded && sequenceHold) || sequenceSkippable);

  // Only show choices in this block that do not have a thumbnail
  const filteredChoices = sequenceChoices.filter(({ thumbnail }) => !thumbnail);

  return {
    choices: displayChoices ? filteredChoices || [] : [],
  };
};

const mapDispatchToProps = (dispatch) => ({
  onSelectChoice: (contentId) => dispatch(requestTransitionToSequence(contentId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Choices);
