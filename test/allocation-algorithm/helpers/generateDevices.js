const generateDevices = (initialDevices = [], numAdditionalDevices = 0) => {
  const devices = [];

  for (let i = 0; i < initialDevices.length + numAdditionalDevices; i += 1) {
    devices.push({
      deviceId: `default-device-id-${i + 1}`,
      deviceIsMain: (i === 0),
      deviceJoiningNumber: i + 1,
      deviceCurrentNumber: i + 1,
      deviceTags: [],
      ...(initialDevices[i] || {}),
    });
  }

  return devices;
};

export default generateDevices;
