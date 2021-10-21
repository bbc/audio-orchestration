const auxDevicesOnly = ({ devices }) => {
  const prohibited = devices
    .filter(({ deviceIsMain }) => deviceIsMain)
    .map(({ deviceId }) => deviceId);
  return {
    prohibited,
  };
};

export default auxDevicesOnly;
