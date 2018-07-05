import Rules from './rules';


/**
 * Allocates objects to devices.
 *
 * @param {Array<MdoObject>} objects
 * @param {Array<MdoDevice>} devices
 * @param {Object} previousAllocations
 *
 * @return {Object} allocations, mapping objectId => [deviceId]
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
  }));

  // Apply simple rules for reducing the domains in order
  [
    Rules.mdoOnly,
    Rules.mdoThreshold,
    Rules.zonesNever,
    Rules.minQuality,
    Rules.exclusivity,
    Rules.muteIf,
    Rules.chooseOrSpread,
  ].forEach(f => f(domains, objects, devices));

  // Choose the best device(s) out of the remaining domains.
  const allocations = {};
  domains.forEach(({ objectId, domain }) => {
    allocations[objectId] = Array.from(domain.values());
  });
  return allocations;
}

export default allocate;
