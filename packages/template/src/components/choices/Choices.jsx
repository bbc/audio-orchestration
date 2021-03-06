/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from 'components/button/Button';

const Choices = ({
  choices,
  onSelectChoice,
}) => (
  <div
    className={classnames(
      'choices',
    )}
  >
    { choices.filter(({ hidden }) => !hidden).map(({ label, contentId }) => (
      <Button key={label} content={label} onClick={() => onSelectChoice(contentId)} />
    ))}
  </div>
);

Choices.propTypes = {
  /* The list of choices to display, including their label and target content id */
  choices: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    contentId: PropTypes.string.isRequired,
  })).isRequired,
  onSelectChoice: PropTypes.func.isRequired,
};

export default Choices;
