import React from 'react';
import config from 'config';
import Button from '../button/Button';

const RatingPrompt = () => (
  <div className="rating-prompt">
    {config.PROMPT_TITLE && <h2>{config.PROMPT_TITLE}</h2>}
    {config.PROMPT_BODY && <p>{config.PROMPT_BODY}</p>}
    {config.PROMPT_BUTTON_LINK && config.PROMPT_BUTTON_TEXT && (
      <p>
        <Button
          onClick={() => window.open(config.PROMPT_BUTTON_LINK)}
          content={config.PROMPT_BUTTON_TEXT}
        />
      </p>
    )}
  </div>
);

export default RatingPrompt;
