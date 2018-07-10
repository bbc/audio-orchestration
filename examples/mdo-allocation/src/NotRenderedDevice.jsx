import React from 'react';

const NotRenderedDevice = ({
  allocations,
  visibleObjects,
}) => (
  <div className="device not-rendered-device">
    <h1>
      Inactive objects
    </h1>

    <ul className="object-list">
      {
      Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.length === 0)
        .filter(([objectId]) => visibleObjects.includes(objectId))
        .map(([objectId]) => objectId)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map(objectId => (
          <li
            key={objectId}
          >
            { objectId.substr(0, 8) }
          </li>
        ))
      }
    </ul>

    <p>
      {`+ ${Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.length === 0)
        .filter(([objectId]) => !visibleObjects.includes(objectId))
        .length
      } hidden`}
    </p>
  </div>
);

export default NotRenderedDevice;
