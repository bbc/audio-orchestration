/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import copy from 'clipboard-copy';
import classnames from 'classnames';
import Button from 'components/button/Button';
import Input from 'components/input/Input';
import Icon from 'components/icon/Icon';
import config from 'config';
import bowser from 'bowser';

const browser = bowser.getParser(window.navigator.userAgent);

const Share = ({
  url,
  small,
}) => {
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

  // TODO: not showing share button in macOS Chrome, based on a single browser crash report.
  const showShareButton = !!navigator.share && !(browser.is('Chrome') && browser.is('macOS'));

  const handleShare = () => {
    try {
      navigator.share({
        title: config.TEXT_TITLE,
        text: config.TEXT_INTRODUCTION,
        url,
      });
    } catch (e) {
      console.error('navigator.share failed', e);
    }
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
    <span className={classnames('share', { small })}>
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
        <Icon
          name={success ? 'check' : 'copy'}
          size={small ? 'small' : 'normal'}
        />
      </Button>

      { showShareButton && (
        <Button
          icon
          onClick={handleShare}
          className="accent-colour-background"
          title="Share link"
        >
          <Icon
            name="share"
            size={small ? 'small' : 'normal'}
          />
        </Button>
      )}
    </span>
  );
};

Share.propTypes = {
  url: PropTypes.string.isRequired,
  small: PropTypes.bool,
};

Share.defaultProps = {
  small: false,
};

export default Share;
