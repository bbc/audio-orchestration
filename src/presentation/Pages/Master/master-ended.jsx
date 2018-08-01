import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';

const MasterEnded = ({
  playAgain,
}) => (
  <div className="page page-master">
    <h1>
      Thanks for listening.
    </h1>

    <p>
      This is the main device&apos;s end screen. It may contain feedback prompts or links to onward
      journeys, such as background information or social sharing options.
    </p>

    <p>
      <LargeButton
        text="Play again"
        onClick={playAgain}
      />
    </p>
  </div>
);

MasterEnded.propTypes = {
  playAgain: PropTypes.func.isRequired,
};

export default MasterEnded;
