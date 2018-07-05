import React from 'react';

const DISTANCES = [
  'near',
  'far',
];

const DIRECTIONS = [
  'front',
  'side',
  'rear',
];


const Device = ({
  deviceId,
  mainDevice,
  location,
  enabled,
  updateDeviceInfo,
  allocations,
}) => (
  <div className="device">
    <h1>
      { deviceId }
    </h1>

    <p>
      <button
        type="button"
        disabled={mainDevice}
        className={`enable-button ${enabled ? 'enabled' : 'disabled'}`}
        onClick={() => updateDeviceInfo({
          location,
          enabled: !enabled,
        })}
      >
        {enabled ? 'Disconnect' : 'Connect'}
        {mainDevice ? ' (Main)' : ''}
      </button>
    </p>

    <p>
      { DISTANCES.map(distance => (
        <button
          key={distance}
          type="button"
          className={`location-button ${location.distance === distance ? 'enabled' : 'disabled'}`}
          onClick={() => updateDeviceInfo({
            enabled,
            location: {
              distance,
              direction: location.direction,
            },
          })}
        >
          { distance }
        </button>
      ))}
    </p>

    <p>
      { DIRECTIONS.map(direction => (
        <button
          key={direction}
          type="button"
          className={`location-button ${location.direction === direction ? 'enabled' : 'disabled'}`}
          onClick={() => updateDeviceInfo({
            enabled,
            location: {
              direction,
              distance: location.distance,
            },
          })}
        >
          { direction }
        </button>
      ))}
    </p>

    <ul className="object-list">
      {
      Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.includes(deviceId))
        .map(([objectId]) => objectId)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map(objectId => (
          <li key={objectId}>
            { objectId.substr(0, 8) }
          </li>
        ))
      }
    </ul>
  </div>
);

export default Device;
