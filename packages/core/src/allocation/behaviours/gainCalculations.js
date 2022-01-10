/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */

/**
 * @param {Number} decibels
 * @returns {Number}
 */
export const convertDecibelsToLinearGain = (decibels) => 10 ** (decibels / 20);
