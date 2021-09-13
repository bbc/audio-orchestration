/**
 *  formats a duration in seconds as 'minutes:[0]seconds'.
 *
 *  @param {number} duration in seconds
 *  @returns {string} formatted duration
 */
const formatTime = (duration) => {
  const seconds = Math.floor(duration % 60);
  const minutes = Math.floor(duration / 60);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default formatTime;
