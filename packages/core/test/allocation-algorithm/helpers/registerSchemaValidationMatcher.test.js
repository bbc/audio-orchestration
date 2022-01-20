/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import registerSchemaValidationMatcher from './registerSchemaValidationMatcher';

registerSchemaValidationMatcher(expect);

describe('registerSchemaValidationMatcher', () => {
  it('accepts an empty list of objects', () => {
    expect([]).toMatchSchema('objects');
  });

  it('accepts an empty list of devices', () => {
    expect([]).toMatchSchema('devices');
  });

  it('accepts an empty allocations object', () => {
    expect({}).toMatchSchema('allocations');
  });

  it('accepts a valid allocations object', () => {
    expect({
      'device-id-1': [
        { objectId: 'object-id-1' },
        { objectId: 'object-id-2', gain: 15 },
      ],
    }).toMatchSchema('allocations');
  });

  it('fails with an invalid list of objects', () => {
    expect([{ objectId: 7 }]).not.toMatchSchema('objects');
  });

  it('fails with an invalid list of devices', () => {
    expect([{ deviceId: 3 }]).not.toMatchSchema('devices');
  });

  it('fails with an invalid allocations object', () => {
    expect({
      'device-0': [{}],
    }).not.toMatchSchema('allocations');
  });
});
