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

  console.log(domains);

  // Apply simple rules for reducing the domains in order

  [
    Rules.mdoOnly,
    Rules.mdoThreshold,
    Rules.zonesNever,
  ].forEach(f => f(domains, objects, devices));

  // Choose the best device(s) out of the remaining domains.
  const allocations = {};
  domains.forEach(({ objectId, domain }) => {
    const object = objects.find(o => o.objectId === objectId);
    const domainDeviceIds = Array.from(domain.values());
    switch (domain.size) {
      case 0:
        allocations[objectId] = [];
        break;
      case 1:
        allocations[objectId] = [domainDeviceIds[0]];
        break;
      default:
        if (object.orchestration.mdoSpread) {
          allocations[objectId] = domainDeviceIds;
        } else {
          allocations[objectId] = [domainDeviceIds[Math.floor(domain.size * Math.random())]];
        }
        break;
    }
  });
  console.log(allocations);
  return allocations;
}

export default allocate;
