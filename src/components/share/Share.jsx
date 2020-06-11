import React, { useState, useRef } from 'react';
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

  const share = () => {
    navigator.share({
      title: config.TEXT_TITLE,
      text: config.TEXT_INTRODUCTION,
      url,
    });
  };

  const copyToClipboard = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }

    copy(url).then(() => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    });
  };

  return (
    <span className="share">
      <Input readOnly value={url} ref={inputRef} onFocus={() => inputRef.current.select()} />

      <Button
        icon
        onClick={copyToClipboard}
        className={classnames(
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
        onClick={share}
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
