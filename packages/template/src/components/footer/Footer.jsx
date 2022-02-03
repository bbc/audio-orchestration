/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import Icon from 'components/icon/Icon';

const Footer = () => (
  <div className="footer">
    <p className="logo">
      <Icon title="BBC Research & Development" padded name="bbcrd" />
    </p>
    <p className="small">
      <a href="https://www.bbc.co.uk/makerbox/tools/audio-orchestrator" target="_blank" rel="noopener noreferrer">Created with Audio Orchestrator</a>
    </p>
    <p className="small">
      &copy; BBC R&amp;D 2022
    </p>
  </div>
);

export default Footer;
