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
  activeObjects,
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
      {activeObjects.map(({ objectNumber, objectLabel }) => (
        <li key={objectNumber}>
          { `${objectNumber}: ${objectLabel}` }
        </li>
      ))}
    </ul>
  </div>
);

export default Device;
