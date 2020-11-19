import React from 'react';
import GelIcon from 'components/gel-icon/GelIcon';

/*
 * This is an example of showing some labelled icons introducing the experience requirements on the
 * landing pages. It is intended to be added to the StartPage and ConnectDirectPage components.
 * If other icons are needed, these will need to be added to the GelIcon component.
 *
 * To use this, also uncomment the import of the corresponding scss file in index.js.
 */

const LandingIcons = () => (
  <div className="landing-icons">
    <div>
      <GelIcon name="timer-30-mins" />
      <span className="landing-icons-label">1/2 hour</span>
    </div>
    <div>
      <GelIcon name="smartphone" />
      <span className="landing-icons-label">For 3+ devices</span>
    </div>
    <div>
      <GelIcon name="key-fact" />
      <span className="landing-icons-label">Dim the lights</span>
    </div>
  </div>
);

export default LandingIcons;
