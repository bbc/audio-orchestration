import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

let panel;

const TasterBadge = ({
  pilotId,
  visible,
}) => {
  const [shownOnce, setShownOnce] = useState(false);
  const renderBadge = !!pilotId;

  useEffect(() => {
    // The badge must be initialised once, while the iframe is in the DOM and also visible.
    // (I think - often does not show in firefox and chrome unless we initialise it while visible).
    if (renderBadge && visible && !panel && !shownOnce) {
      setShownOnce(true);

      window.require(['pilot-lib/taster-offsite-panel'], (Panel) => {
        panel = new Panel('.taster-offsite-panel');
      });
    }
  }, [renderBadge, visible]);

  if (!renderBadge) {
    return null;
  }

  return (
    <div className="taster-badge">
      <iframe
        title="Taster badge"
        className={classnames(
          'taster-offsite-panel',
          'wide',
          {
            visible,
          },
        )}
        src={`//www.bbc.co.uk/taster/projects/${pilotId}/offsite/wide`}
        frameBorder="0"
        scrolling="no"
      />
    </div>
  );
};

TasterBadge.propTypes = {
  pilotId: PropTypes.string,
  visible: PropTypes.bool,
};

TasterBadge.defaultProps = {
  visible: false,
  pilotId: null,
};

export default TasterBadge;
