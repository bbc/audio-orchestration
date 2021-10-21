/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
const generateDevices = (initialDevices = [], numAdditionalDevices = 0) => {
  const devices = [];

  for (let i = 0; i < initialDevices.length + numAdditionalDevices; i += 1) {
    devices.push({
      deviceId: `default-device-id-${i + 1}`,
      deviceIsMain: (i === 0),
      deviceJoiningNumber: i + 1,
      deviceCurrentNumber: i + 1,
      deviceControls: [],
      ...(initialDevices[i] || {}),
    });
  }

  return devices;
};

export default generateDevices;
