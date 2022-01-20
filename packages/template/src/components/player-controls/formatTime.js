/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
