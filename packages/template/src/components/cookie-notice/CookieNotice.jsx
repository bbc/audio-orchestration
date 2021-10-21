/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import config from 'config';

/*
 * This is an example of showing a cookie warning on the landing page landing pages. It is intended
 * to be added to the StartPage or ConnectDirectPage as required.
 *
 * To use this, also uncomment the import of the corresponding scss file in index.js.
 */

const CookieNotice = () => (
  <div className="cookie-notice">
    <p>
      {`By clicking "${config.TEXT_START_LABEL}" you are accepting the use of cookies, and agree to our `}
      <a href="//www.bbc.co.uk/privacy/information/policy/" target="_blank" rel="noopener noreferrer">privacy policy</a>
      .
    </p>
  </div>
);

export default CookieNotice;
