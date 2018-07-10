import React from 'react';

const NotRenderedDevice = ({
  allocations,
  visibleObjects,
  setObjectVisible,
}) => (
  <tr className="device not-rendered-device">
    <td colSpan="4">
      Not currently rendered objects
    </td>

    <td>
      {` ${Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.length === 0)
        .filter(([objectId]) => !visibleObjects.includes(objectId))
        .length } ( ${Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.length === 0)
        .filter(([objectId]) => !visibleObjects.includes(objectId))
        .length
      } hidden)`}
    </td>

    <td className="object-list">
      {
      Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.length === 0)
        .filter(([objectId]) => visibleObjects.includes(objectId))
        .map(([objectId]) => objectId)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map(objectId => (
          <button
            type="button"
            key={objectId}
            onClick={() => setObjectVisible(objectId, false)}
          >
            { objectId.substr(0, 8) }
          </button>
        ))
      }
    </td>
  </tr>
);

export default NotRenderedDevice;
