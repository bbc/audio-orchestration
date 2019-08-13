import React from 'react';

const Footer = () => (
  <div className="footer">
    <p>
      <a
        href="//www.bbc.co.uk/privacy/information/policy/"
        rel="noopener noreferrer"
        target="_blank"
      >
        Privacy policy
      </a>
      {' | '}
      <a
        href="//www.bbc.co.uk/terms"
        rel="noopener noreferrer"
        target="_blank"
      >
        Terms and conditions
      </a>
    </p>
    <p>
      &copy;&nbsp;2019 The BBC
    </p>
  </div>
);

export default Footer;
