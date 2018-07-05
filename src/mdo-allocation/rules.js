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

function findObject(objects, objectId) {
  return objects.find(o => o.objectId === objectId);
}

function randomElement(a) {
  return a[Math.floor(Math.random() * a.length)];
}

/**
 * Selects a device from the current domain based on its zones and returns its id.
 * If multiple devices in the domain match, chooses one at random.
 *
 * @returns {Array<string>} deviceId, null if no match found in domain.
 */
function domainDevicesByZoneFlag(domain, orchestration, devices, zonePriority) {
  return devices
    .filter(({ deviceId, mainDevice }) => domain.has(deviceId) && !mainDevice)
    .filter(({ location }) =>
      deviceLocationToZones(location).some(zone =>
        orchestration[zone] === zonePriority))
    .map(({ deviceId }) => deviceId);
}

/**
 * Selects the best deviceId remaining in the domain, based on it having a matching should or could
 * zone. Returns null if no MDO device matches. In this case, the main device may be selected.
 */
function bestInDomainByZone(domain, orchestration, devices) {
  const should = domainDevicesByZoneFlag(domain, orchestration, devices, SHOULD);
  const could = domainDevicesByZoneFlag(domain, orchestration, devices, COULD);
  if (should.length > 0) {
    return randomElement(should);
  } else if (could.size > 0) {
    return randomElement(could);
  }
  return null;
}

/*
 * These rules only ever delete devices from the domains of objects. Devices or object metadata is
 * not modified. Each rule should only be concerned with its property's own effect. It may use the
 * information in other object's domains to make decisions.
 */
export default {
  /*
   * mdoOnly: An object with mdoOnly set can never go to the main device.
   */
  mdoOnly: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = findObject(objects, objectId);
      if (orchestration.mdoOnly) {
        const mainDevice = devices.find(d => d.mainDevice === true);
        if (mainDevice !== undefined) {
          domain.delete(mainDevice.deviceId);
        }
      }
    });
  },
  /*
   * mdoThreshold: An object can not go into any MDO device if the number of MDO devices is
   * lower than the threshold. They may still appear in the main device
   */
  mdoThreshold: (domains, objects, devices) => {
    const numMdoDevices = devices.filter(d => d.enabled === true && d.mainDevice === false).length;
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = findObject(objects, objectId);
      devices.forEach(({ deviceId, mainDevice }) => {
        if (!mainDevice && numMdoDevices < orchestration.mdoThreshold) {
          domain.delete(deviceId);
        }
      });
    });
  },
  /*
   * zonesNever: An object can never go into any MDO device that is in a zone the object lists as
   * 'never'. If any zone for a device with multiple possible zones matches a never-zone for the
   * object, that device cannot be used.
   */
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
  /*
   * minQuality: An object can never go into a device that has a quality lower than this setting.
   * The quality rating is ignored for the main device.
   */
  minQuality: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      devices.forEach(({ deviceId, quality, mainDevice }) => {
        if (quality < orchestration.minQuality && !mainDevice) {
          domain.delete(deviceId);
        }
      });
    });
  },
  /*
   * exclusivity: An exclusive object commands control of the entire device. This rule chooses the
   * 'best' device for each exclusive object if possible, and then removes that device from every
   * other object's domain.
   */
  exclusivity: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.exclusivity) {
        const bestDeviceId = bestInDomainByZone(domain, orchestration, devices);
        if (bestDeviceId !== null) {
          // remove all unselected device ids from this exclusive object's domain
          devices.forEach(({ deviceId }) => {
            if (deviceId !== bestDeviceId) {
              domain.delete(deviceId);
            }
          });

          // remove the selected device from all other object's domains
          domains.forEach(({ domain: otherDomain, objectId: otherObjectId }) => {
            if (otherObjectId !== objectId) {
              otherDomain.delete(bestDeviceId);
            }
          });
        }
      }
    });
  },
  /*
   * muteIf: The object disappears entirely if another object is active. If the domain for the
   * referenced object is not empty, remove all devices from this object's domain.
   */
  muteIf: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.muteIfObject !== 0) {
        const muteIfObjectId = objectNumberToId(objects, orchestration.muteIfObject);
        if (muteIfObjectId !== undefined) {
          if (domains.find(d => d.objectId === muteIfObjectId).domain.size > 0) {
            domain.clear();
          }
        }
      }
    });
  },
  /* chooseOrSpread: For objects without the mdoSpread setting, reduce the domain size to 1 by
   * picking a random available should-zone device, or if no matching devices are available, fall
   * back to a could-zone device. mdoSpread objects retain their domains unchanged.
   */
  chooseOrSpread: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.mdoSpread || domain.size <= 1) {
        return;
      }

      const bestDevice = bestInDomainByZone(domain, orchestration, devices);
      if (bestDevice !== null) {
        // delete all but the best (should, or maybe could) device.
        devices.forEach(({ deviceId }) => {
          if (deviceId !== bestDevice) {
            domain.delete(deviceId);
          }
        });
      } else {
        // no suitable MDO device selected, so remove all but the main device.
        devices.forEach(({ deviceId, mainDevice }) => {
          if (!mainDevice) {
            domain.delete(deviceId);
          }
        });
      }

    });
  },
};
