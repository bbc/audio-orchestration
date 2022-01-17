/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Icon from 'components/icon/Icon';
import formatTime from 'components/player-controls/formatTime';

const showDurationBar = false;

const ThumbnailChoices = ({
  choices,
  onSelectChoice,
}) => {
  const maxDuration = choices.reduce((acc, { duration }) => Math.max(duration || 0, acc), 0);

  return (
    <ul
      className={classnames(
        'thumbnail-choices',
      )}
    >
      { choices.map(({
        label,
        sequenceTitle,
        sequenceSubtitle,
        sequenceImage,
        sequenceImageAlt,
        duration,
        contentId,
      }) => (
        <li key={label}>
          <button type="button" className="thumbnail-choice" onClick={() => onSelectChoice(contentId)}>
            <div className="thumbnail-image">
              <img src={sequenceImage} width={100} alt={sequenceImageAlt} height={100} />
              <div className="thumbnail-icon">
                <Icon size="tiny" name="play" />
              </div>
            </div>
            <div className="thumbnail-meta">
              <h2>{sequenceTitle || label}</h2>
              <h3>{sequenceSubtitle}</h3>
              {duration !== undefined && (
                <div className="duration">
                  <span className="duration-text">{formatTime(duration)}</span>
                  {showDurationBar && (
                    <div className="duration-bar">
                      <div className="duration-bar-filled accent-colour-background" style={{ width: `${(duration / maxDuration) * 100}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

ThumbnailChoices.propTypes = {
  /* The list of choices to display, including their label and target content id */
  choices: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    contentId: PropTypes.string.isRequired,
    sequenceTitle: PropTypes.string,
    sequenceSubtitle: PropTypes.string,
    sequenceImage: PropTypes.string,
    sequenceImageAlt: PropTypes.string,
    duration: PropTypes.number.isRequired,
  })).isRequired,
  onSelectChoice: PropTypes.func.isRequired,
};

export default ThumbnailChoices;
