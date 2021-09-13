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
      &copy; BBC R&amp;D 2020
    </p>
  </div>
);

export default Footer;
