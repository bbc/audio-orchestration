# Tests for bbcat-orchestration

We use the _Jest_ testing framework and keep our test definitions in the `test/` folder laid out to mirror the `src/` file structure.

Useful commands:

```sh
yarn test             # run all tests and print a summary
yarn test --watch     # automatically re-run any relevant tests on changes to source or test code
yarn test --verbose   # print details of each test that was run
yarn test --coverage  # collect coverage information (creates a report in (repo-root)/coverage/)
```

Jenkins (our continuous integration system) requires all tests to pass before allowing us to merge a pull request. We can mark tests as `skip` to only produce a warning, for example if we are using unit tests to define future features.

The [Jest Documentation](https://jestjs.io/docs/en/using-matchers) is a good starting point to understand its globally defined functions and variables. 

In general, we `describe` a class or feature using a number of tests, each saying that `it` should do something, and we `expect` certain conditions at the end of the test. An individual test is defined using `it` or `test`.

```js
describe('MyClass', () => {
  describe('sayHello', () => {
    it('returns the string "hello"', () => {
      const a = new MyClass();
      const result = a.sayHello();

      expect(result).toEqual('hello');
    });
  });
});
```

## Allocation Algorithm

Currently all tests are defined directly in [DefaultAllocationAlgorithm.test.js](./allocation-algorithm/DefaultAllocationAlgorithm.test.js), and any new cases should be added there. Most of the current test pass some object and device metadata to the algorithm, and then check the returned allocations for a number of conditions.

We have added some custom [helper functions and Jest matchers](./allocation-algorithm/helpers) to facilitate this way of testing many similar scenarios. These are listed below.

### `wrapAllocate`

Use this to create a function that calls the algorithm's allocate method but also checks its inputs and outputs against the JSON schema definitions. Fails the test if they don't match up.

```js
import wrapAllocate from './helpers/wrapAllocate';

const wrappedAllocate = wrapAllocate(new DefaultAllocationAlgorithm());
```

### `generateDevices`

Use this to fill in any missing mandatory fields with default values to create valid device metadata, and optionally create some more devices using only the default values.

```js
import generateDevices from './helpers/generateDevices';

generateDevices([
  { deviceId: 'device-1' },
  { deviceId: 'device-2', deviceControls: [ { controlId: 'foo', controlValue: ['bar'] } ] },
], 3);
```

### Schema validation matchers

Use the `toMatchSchema` matcher to validate a value against a specific JSON schema, using the identifier registered in [registerSchemaValidationMatcher.js](./allocation-algorithm/helpers/registerSchemaValidationMatcher.js).

```js
import registerSchemaValidationMatcher from './helpers/registerSchemaValidationMatcher';

// before any tests:
registerSchemaValidationMatcher();

expect(myObjects).toMatchSchema('objects');
expect(myDevices).toMatchSchema('devices');
expect(myAllocations).toMatchSchema('allocations');
```

### Allocation validation matchers

Use these to enforce conditions on an allocations object. As usual, any matcher's condition can be inverted by prefixing it with `not.`.

```js
import registerAllocationValidationMatchers from './helpers/registerAllocationValidationMatchers';

// before any tests:
registerAllocationValidationMatchers();

// object is in any device (at least one):
expect(allocations).toHaveObjectInAnyDevice('my-object-id');

// object is in a specific device:
expect(allocations).toHaveObjectInDevice('my-object-id', 'my-device-id');

// object is in a specific device, with a specific gain:
expect(allocations).toHaveObjectInDeviceWithGain('my-object-id', 'my-device-id', 0.67);

// object is in a specific number of devices:
expect(allocations).toHaveObjectInNumDevices('my-object-id', 3);
```
