/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */

/**
 */
const auxDevicesOnly = ({ devices }) => {
  const prohibited = devices
    .filter(({ deviceIsMain }) => deviceIsMain)
    .map(({ deviceId }) => deviceId);
  return {
    prohibited,
  };
};

export default auxDevicesOnly;
