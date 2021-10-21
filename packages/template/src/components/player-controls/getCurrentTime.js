/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * Calculates the current time on a clock based on its correlation to Date.now(). Applies
 * min/max to never return a time less than 0 or greater than the media duration.
 *
 * @param {object} correlation
 * @param {number} correlation.parentTime - the offset (in seconds) from Date.now(), the value of
 * Date.now() when the clock was childTime.
 * @param {number} correlation.childTime - the playback position (in seconds) shown on the clock
 * when Date.now() was parentTime.
 * @param {number} speed - the clock speed, 0 if stopped, 1 if playing at normal speed.
 * @param {number} duration - duration of the content
 * @param {bool} loop - whether the content is playing in a loop
 *
 * @returns {number} time/duration, in seconds, to be displayed
 */
const getCurrentTime = ({ parentTime, childTime }, speed, duration, loop) => {
  // Get the current wallclock time in seconds
  const now = Date.now() / 1000;

  // Convert between now (on the same clock as parentTime) and the media time (the childTime clock)
  const currentTime = (childTime + ((now - parentTime) * speed));

  // Because the orchestration library does not necessarily update the correlation when wrapping
  // around a looped sequence, we have to ensure here we don't show a position beyond the duration.
  // Also, if the sequence has just been scheduled to begin shortly in the future, we might end up
  // with a negative time and will display that as 0 seconds.
  if (loop) {
    return Math.max(0, currentTime % duration);
  }
  return Math.max(0, Math.min(currentTime, duration));
};

export default getCurrentTime;
