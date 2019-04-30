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

const SOFT_STAY = 1;
const HARD_STAY = 2;

/**
 * lists all zone names (usually just one) corresponding to a device's location setting.
 *
 * @param {object} location
 * @property {string} location.distance
 * @property {string} location.direction
 *
 * @returns {Array<string>} zones
 */
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
 * Selects all deviceIds that match the given zone priority for the given orchestration object.
 * The mainDevice is never included in the results, and its location is ignored.
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
function bestInDomainByZone(domain, orchestration, devices, preferred = undefined) {
  const should = domainDevicesByZoneFlag(domain, orchestration, devices, SHOULD);
  const could = domainDevicesByZoneFlag(domain, orchestration, devices, COULD);

  // if already in a should device, or no should devices available, stay in the same:
  if (should.includes(preferred) || (should.length === 0 && could.includes(preferred))) {
    return preferred;
  }

  if (should.length > 0) {
    return randomElement(should);
  } else if (could.length > 0) {
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
      domainDevicesByZoneFlag(domain, orchestration, devices, NEVER).forEach((deviceId) => {
        domain.delete(deviceId);
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
   * updatePreferred: The preferred speaker is normally the object's previous allocation. If this
   * is not set, or no longer available due to previous rules, replace it with one from the current
   * domain.
   */
  updatePreferred: (domains, objects, devices) => {
    domains.forEach((objectState) => {
      const { objectId, domain, preferred } = objectState;
      const { orchestration } = objects.find(o => o.objectId === objectId);

      // mdo spread objects do not need a preferred allocation, they always go to all available.
      if (orchestration.mdoSpread) {
        objectState.preferred = undefined;
        return;
      }

      // if preferred is the main device, always attempt moving to an MDO device.
      if ((devices.find(d => d.deviceId === preferred) || {}).mainDevice === true) {
        objectState.preferred = undefined;
        return;
      }

      // if preferred is set, still available, and object is a soft-stay, only reassign if a better
      // device is available
      if (preferred !== undefined && domain.has(preferred) && objectState.onDropin === SOFT_STAY) {
        objectState.preferred = bestInDomainByZone(domain, orchestration, devices, preferred);
      }

      // if the previous allocation hasn't been set, or is no longer available, choose the best.
      if (preferred === undefined || !(domain.has(preferred))) {
        objectState.preferred = bestInDomainByZone(domain, orchestration, devices);
      }
    });
  },
  /*
   * exclusivity: An exclusive object commands control of the entire device. This rule chooses the
   * 'best' device for each exclusive object if possible, and then removes that device from every
   * other object's domain.
   *
   * TODO: Confirm that exclusive objects must always have mdoOnly (or that exclusive applies to
   * mainDevice). Currently assume that exclusive implies it can never be in mainDevice.
   *
   * TODO: take into account every other object's preferred allocation, if it is higher priority
   * or has the hard-stay flag.
   */
  exclusivity: (domains, objects, devices) => {
    domains.forEach(({ objectId, domain, preferred }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.exclusivity) {
        // Remove any devices from this exclusive object's domain if it is protected by a higher
        // priority object or a hard-stay object.
        const protectedDomain = new Set();
        domain.forEach((deviceId) => {
          // for all objects that are not this one,
          // and tentatively in the device we are considering,
          // and that are HARD_STAY or higher priority,
          // if any of those exist, mark the current device as protected
          const isProtected = domains
            .filter(other => other.preferred === deviceId && other.objectId !== objectId)
            .some((other) => {
              const otherObject = objects.find(o => o.objectId === other.objectId);
              const otherOrchestration = otherObject.orchestration;
              return otherOrchestration.onDropin === HARD_STAY
                || otherOrchestration.objectNumber < orchestration.objectNumber;
            });
          if (isProtected) {
            protectedDomain.add(deviceId);
          }
        });
        protectedDomain.forEach(d => domain.delete(d));

        const bestDeviceId = bestInDomainByZone(domain, orchestration, devices, preferred);

        if (bestDeviceId !== null) {
          // console.debug(`EXCLUSIVITY: ${objectId} is exclusive in device ${bestDeviceId}`);
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
        } else {
          domain.clear();
          // console.debug(`EXCLUSIVITY: ${objectId} is exclusive but has no MDO devices to be in.`);
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
            // console.debug(`MUTEIF: ${objectId} muted as ${muteIfObjectId} is active`);
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
    domains.forEach(({ objectId, domain, preferred }) => {
      const { orchestration } = objects.find(o => o.objectId === objectId);
      if (orchestration.mdoSpread || domain.size <= 1) {
        return;
      }

      let bestDevice = preferred;
      if (!(domain.has(bestDevice))) {
        bestDevice = bestInDomainByZone(domain, orchestration, devices);
      }

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
