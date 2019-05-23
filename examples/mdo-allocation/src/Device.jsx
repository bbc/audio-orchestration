import React from 'react';

const ZONES = [
  'nearFront',
  'nearSide',
  'nearRear',
  'farFront',
  'farSide',
  'farRear',
];

const Device = ({
  deviceId,
  mainDevice,
  location,
  enabled,
  updateDeviceInfo,
  allocations,
  visibleObjects,
  setObjectVisible,
}) => (
  <tr className="device">
    <td>
      { deviceId }
    </td>
    <td>
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
    </td>
    <td>
      { ZONES.map(zone => (
        <button
          key={zone}
          type="button"
          className={`location-button ${location === zone ? 'enabled' : 'disabled'}`}
          onClick={() => updateDeviceInfo({
            enabled,
            location: zone,
          })}
        >
          { zone }
        </button>
      ))}
    </td>
    <td>
      {
      `${Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.includes(deviceId))
        .length}`
      }
      {
      ` (${Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.includes(deviceId))
        .filter(([objectId]) => !visibleObjects.includes(objectId))
        .length} hidden)`
      }
    </td>
    <td className="object-list">
      {
      Object.entries(allocations)
        .filter(([objectId, deviceIds]) => deviceIds.includes(deviceId))
        .filter(([objectId, deviceIds]) => visibleObjects.includes(objectId))
        .map(([objectId]) => objectId)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        .map(objectId => (
          <button
            type="button"
            key={objectId}
            onClick={() => setObjectVisible(objectId, false)}
          >
            { objectId }
          </button>
        ))
      }
    </td>
  </tr>
);

export default Device;
