// left-hand side is the value of the property being tested
// right-hand side is the value from the object metadata that we have to compare it to
const operators = new Map();

operators.set('equals', (lhs, rhs) => lhs === rhs);

operators.set('lessThan', (lhs, rhs) => lhs < rhs);

operators.set('lessThanOrEqual', (lhs, rhs) => lhs <= rhs);

operators.set('greaterThan', (lhs, rhs) => lhs > rhs);

operators.set('greaterThanOrEqual', (lhs, rhs) => lhs >= rhs);

// expects rhs to be an array
operators.set('anyOf', (lhs, rhs) => rhs.includes(lhs));

operators.set('moduloIsZero', (lhs, rhs) => lhs % rhs === 0);

export const evaluateConditions = (deviceId, {
  devices,
  session,
  behaviourParameters,
}) => {
  const { conditions } = behaviourParameters;
  const device = devices.find((d => d.deviceId === deviceId));
  const { deviceControls = [] } = device;

  // Conditions are AND'ed - all have to be true for this function to return true.
  let result = true;
  conditions.forEach((condition) => {
    const {
      property,
      invertCondition,
      operator,
      value,
    } = condition;

    // Find the property value to compare to - property looks like 'device.foo', 'session.bar', or
    // 'deviceControls.myControlId' and must only contain exactly one '.'
    let propertyValue;
    const [propertySource, propertyName] = property.split('.');
    if (propertySource && propertyName) {
      switch (propertySource) {
        case 'device':
          propertyValue = device[propertyName];
          break;
        case 'deviceControls':
          propertyValue = (deviceControls.find(({ controlId }) => controlId === propertyName) || {})
            .controlValues;
          break;
        case 'session':
          propertyValue = session[propertyName];
          break;
        default:
          break;
      }
    }

    // Do the comparison if the requested operator exists
    if (operators.has(operator)) {
      let conditionResult;
      const operatorFn = operators.get(operator);

      if (Array.isArray(propertyValue)) {
        conditionResult = propertyValue.some(pv => operatorFn(pv, value));
      } else {
        conditionResult = operatorFn(propertyValue, value);
      }

      // console.debug(`${property} ${propertyValue} ${operator} ${value} => ${conditionResult}`);

      result = result && (invertCondition ? !conditionResult : conditionResult);
    } else {
      console.warn(`unknown operator ${operator}, ignoring condition on ${property}`);
    }
  });

  return result;
};

export const preferredIf = args => ({
  preferred: args.devices
    .filter(({ deviceId }) => evaluateConditions(deviceId, args))
    .map(({ deviceId }) => deviceId),
});

export const allowedIf = args => ({
  allowed: args.devices
    .filter(({ deviceId }) => evaluateConditions(deviceId, args))
    .map(({ deviceId }) => deviceId),
});

export const prohibitedIf = args => ({
  prohibited: args.devices
    .filter(({ deviceId }) => evaluateConditions(deviceId, args))
    .map(({ deviceId }) => deviceId),
});
