import Rules from './rules';

const defaultRules = new Rules();

/**
 * Allocates objects to devices.
 *
 * @param {Array<MdoObject>} objects
 * @param {Array<MdoDevice>} devices
 * @param {Object} [previousAllocations] - mapping of objectId => [deviceId].
 * @param {Rules} [rules] - customised Rules instance to apply
 *
 * @return {Object} allocations, mapping of objectId => [deviceId]
 */
function allocate(objects, devices, previousAllocations = {}, rules = defaultRules) {
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

  // Apply the rules to reduce the domains to the final allocations
  rules.applyAll(domains, objects, devices);

  // transform the list of domains into an allocations object, mapping each objectId to a list
  // of assigned deviceIds.
  const allocations = {};
  domains.forEach(({ objectId, domain }) => {
    allocations[objectId] = Array.from(domain.values());
  });
  return allocations;
}

export default allocate;
