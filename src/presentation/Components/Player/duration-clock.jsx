import React from 'react';
import PropTypes from 'prop-types';

/**
 *  formats a duration in seconds as 'minutes:[0]seconds'.
 *
 *  @param {number} duration in seconds
 *  @returns {string} formatted duration
 */
const formatDuration = (duration) => {
  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor(duration / 60);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

/**
 * Calculates the duration on a clock based on its correlation to Date.now().
 *
 * @param {number} parentTime - the offset (in seconds) from Date.now(), the value of Date.now()
 * when the clock was childTime.
 * @param {number} childTime - the playback position (in seconds) shown on the clock when
 * Date.now() was parentTime.
 * @param {number} speed - the clock speed, 0 if stopped.
 *
 * @returns {number} duration, in seconds, to be displayed
 */
const getDuration = (parentTime, childTime, speed) => {
  const now = Date.now() / 1000;
  return (childTime + ((now - parentTime) * speed));
};

class DurationClock extends React.Component {
  componentDidMount() {
    this.updating = true;
    this.updateTimeout = null;

    this.setupForceUpdate();
  }

  componentDidUpdate() {
    this.setupForceUpdate();
  }

  componentWillUnmount() {
    this.updating = false;
  }

  setupForceUpdate() {
    // do not continue updating every frame if the component is not mounted
    if (this.updating === false) {
      return;
    }

    // do not continue updating every frame if the clock is not actually running.
    const { speed } = this.props;
    if (speed === 0) {
      return;
    }

    // otherwise, force an update on the next animation frame.
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.forceUpdate();
      this.setupForceUpdate();
    }, 100);
  }

  render() {
    const { speed, duration, correlation } = this.props;
    const { parentTime, childTime } = correlation;
    const displayTime = Math.max(0, Math.min(getDuration(parentTime, childTime, speed), duration));
    return (
      <span>
        {formatDuration(displayTime)}
        {' / '}
        {formatDuration(duration)}
      </span>
    );
  }
}

DurationClock.propTypes = {
  correlation: PropTypes.shape({
    parentTime: PropTypes.number.isRequired,
    childTime: PropTypes.number.isRequired,
  }).isRequired,
  speed: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
};

export default DurationClock;

