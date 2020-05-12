import React, { useState } from 'react';
import PropTypes from 'prop-types';
import copy from 'clipboard-copy';
import Button from 'components/button/Button';
import Icon from 'components/icon/Icon';


import config from 'config';

const Share = ({ url }) => {
  const [copyToast, setCopyToast] = useState(false);

  const share = () => {
    navigator.share({
      title: config.TEXT_TITLE,
      text: config.TEXT_INTRODUCTION,
      url,
    });
  };

  const copyToClipboard = () => {
    copy(url).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  return (
    <div className="share">
      <Button icon onClick={copyToClipboard}><Icon name="copy" /></Button>

      { navigator.share && (
        <Button className="leftMargin" icon onClick={share}><Icon name="share" /></Button>
      )}
      <h3 className={copyToast ? 'show' : ''} id="copy-confirmation-toast">Copied to clipboard.</h3>
    </div>
  );
};

Share.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Share;
