import Rules from './rules';

/**
 * Allocates objects to devices.
 *
 * @param {Array<MdoObject>} objects
 * @param {Array<MdoDevice>} devices
 * @param {Object} [previousAllocations] - mapping of objectId => [deviceId].
 *
 * TODO: previousAllocations are not currently used, but will be required for dropIn/dropOut rules.
 *
 * @return {Object} allocations, mapping of objectId => [deviceId]
 */
function allocate(objects, devices, previousAllocations = {}) {
  // define domains, starting out with all objects being able to go into all devices.
  // as we progress, incosistent values are removed from the domains.
  const availableDeviceIds = devices
    .filter(d => d.enabled)
    .map(d => d.deviceId);

  const domains = objects.map(({ objectId }) => ({
    objectId,
    domain: new Set(availableDeviceIds),
    preferred: (previousAllocations[objectId] || [])[0],
  }));

  // Apply rules for reducing the domains:
  [
    Rules.mdoOnly, // remove main device if mdoOnly
    Rules.mdoThreshold, // remove mdo devices if too few devices available
    Rules.zonesNever, // remove mdo devices in 'never' zones
    Rules.minQuality, // remove mdo devices of too low quality
    Rules.updatePreferred, // set a preferred speaker from remaining set, if not already set.
    Rules.exclusivity, // assign exclusive objects, remove their devices from all other objects
    Rules.muteIf, // remove all devices if the referenced object has potential devices
    Rules.chooseOrSpread, // assign to best remaining device, or all remaining devices for spread
  ].forEach(f => f(domains, objects, devices));

  // transform the list of domains into an allocations object, mapping each objectId to a list
  // of assigned deviceIds.
  const allocations = {};
  domains.forEach(({ objectId, domain }) => {
    allocations[objectId] = Array.from(domain.values());
  });
  return allocations;
}

export default allocate;
