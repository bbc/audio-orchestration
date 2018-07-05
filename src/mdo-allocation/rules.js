/**
 * @typedef {Object} MdoLocation
 *
 * @property {string} direction (one of 'front', 'side', 'rear')
 * @property {string} distance (one of 'near', 'far')
 */

/**
 * @typedef {Object} MdoDevice
 * @desc the MdoDevice contains the loudspeaker metadata.
 *
 * @property {string} deviceId
 * @property {boolean} mainDevice - whether this is the main device or an auxiliary device.
 * @property {number} quality
 * @property {number} joinOrder
 * @property {MdoLocation} location
 */

/**
 * lists all zone names (usually just one) corresponding to a device's location setting.
 *
 * @param {object} location
 * @property {string} location.distance
 * @property {string} location.direction
 *
 * @returns {Array<string>}
 */

const DISTANCES = [
  'near',
  'far',
];

const DIRECTIONS = [
  'Front',
  'Side',
  'Rear',
];

const NEVER = 1;
const COULD = 2;
const SHOULD = 3;

function deviceLocationToZones({ distance = null, direction = null } = {}) {
  // Ensure the values are valid - compare lower case to account for capitalisation in DIRECTIONS
  // If one of distance, direction is not set, use all possible values.
  const distances = DISTANCES.filter(d =>
    (distance === null) || (d.toLowerCase() === distance));
  const directions = DIRECTIONS.filter(d =>
    (direction === null) || (d.toLowerCase() === direction));

  const zones = [];
  distances.forEach(dist =>
    directions.forEach(dir =>
      zones.push(`${dist}${dir}`)));
  return zones;
}

/**
 * @param {Array<MdoObject>} objects
 * @param {number} objectNumber
 */
function objectNumberToId(objects, objectNumber) {
  return (objects.find(o => o.orchestration.objectNumber === objectNumber) || {}).objectId;
}

export default {
  mdoOnly: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.mdoOnly) {
        const mainDevice = devices.find(d => d.mainDevice === true);
        if (mainDevice !== undefined) {
          domain.delete(mainDevice.deviceId);
        }
      }
    });
  },
  mdoThreshold: (domains, objects, devices) => {
    const numMdoDevices = devices.filter(d => d.enabled === true && d.mainDevice === false).length;
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      devices.forEach(({ deviceId, mainDevice }) => {
        if (!mainDevice && numMdoDevices < orchestration.mdoThreshold) {
          domain.delete(deviceId);
        }
      });
    });
  },
  zonesNever: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      devices.forEach(({ deviceId, location, mainDevice }) => {
        deviceLocationToZones(location).forEach((zone) => {
          if (!mainDevice && orchestration[zone] === NEVER) {
            domain.delete(deviceId);
          }
        });
      });
    });
  },
};
