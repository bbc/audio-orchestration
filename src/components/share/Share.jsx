import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import copy from 'clipboard-copy';
import classnames from 'classnames';
import Button from 'components/button/Button';
import Input from 'components/input/Input';
import Icon from 'components/icon/Icon';

import config from 'config';

const Share = ({ url }) => {
  const [success, setSuccess] = useState(false);
  const inputRef = useRef();

  // Set a timer to reset the success state, but cancel it if the component is unmounted.
  useEffect(() => {
    let timeout;

    if (success) {
      timeout = setTimeout(() => setSuccess(false), 2000);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [inputRef, success, setSuccess]);

  const handleShare = () => {
    navigator.share({
      title: config.TEXT_TITLE,
      text: config.TEXT_INTRODUCTION,
      url,
    });
  };

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }

    copy(url).then(() => {
      setSuccess(true);
    });
  };

  return (
    <span className="share">
      <Input readOnly value={url} ref={inputRef} onFocus={() => inputRef.current.select()} />

      <Button
        icon
        onClick={handleCopy}
        className={classnames(
          'accent-colour-background',
          'copy-button',
          { success },
        )}
        title="Copy link to clipboard"
      >
        <Icon name={success ? 'check' : 'copy'} />
      </Button>

      { navigator.share && (
        <Button
          icon
          onClick={handleShare}
          className="accent-colour-background"
          title="share link"
        >
          <Icon name="share" />
        </Button>
      )}
    </span>
  );
};

Share.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Share;
