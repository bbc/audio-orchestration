import React from 'react';

const orchestrationColumns = [
  'objectNumber',
  'label',
  'group',
  'mdoThreshold',
  'mdoOnly',
  'mdoMethod',
  'speakerNumber',
  'diffuseness',
  'mdoSpread',
  'mdoDynamic',
  'mdoGainDB',
  'muteIfObject',
  'exclusivity',
  'nearFront',
  'nearSide',
  'nearRear',
  'farFront',
  'farSide',
  'farRear',
  'above',
  'onDropin',
  'onDropout',
  'minQuality',
];

const MetadataTable = ({
  objects,
  visibleObjects,
  setObjectVisible,
}) => (
  <table>
    <thead>
      <tr onClick={() => objects.forEach(({ objectId }) => setObjectVisible(objectId, visibleObjects.length === 0)) }>
        { orchestrationColumns.map(c => (
          <th key={c}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      { objects.map(({ objectId, orchestration }) => (
        <tr
          key={objectId}
          onClick={() => setObjectVisible(objectId, !visibleObjects.includes(objectId))}
          className={`object-row-${visibleObjects.includes(objectId) ? 'enabled' : 'disabled'}`}
        >
          { orchestrationColumns.map(c => (
            <td key={c} className={`meta-${c}`}>
              { `${orchestration[c]}` }
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default MetadataTable;
