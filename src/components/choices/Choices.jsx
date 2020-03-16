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
    { choices.map(({ label, contentId }) => (
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
