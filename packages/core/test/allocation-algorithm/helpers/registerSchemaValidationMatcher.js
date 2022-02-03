/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import Ajv from 'ajv';
import objectSchema from '../../../schemas/object.json';
import objectsSchema from '../../../schemas/objects.json';
import controlSchema from '../../../schemas/control.json';
import controlsSchema from '../../../schemas/controls.json';
import behaviourSchema from '../../../schemas/behaviour.json';
import behavioursSchema from '../../../schemas/behaviours.json';
import deviceSchema from '../../../schemas/device.json';
import devicesSchema from '../../../schemas/devices.json';
import allocationSchema from '../../../schemas/allocation.json';
import allocationsSchema from '../../../schemas/allocations.json';

const ajv = new Ajv();

ajv.addSchema(objectSchema, 'object');
ajv.addSchema(objectsSchema, 'objects');

ajv.addSchema(controlSchema, 'control');
ajv.addSchema(controlsSchema, 'controls');

ajv.addSchema(behaviourSchema, 'behaviour');
ajv.addSchema(behavioursSchema, 'behaviours');

ajv.addSchema(deviceSchema, 'device');
ajv.addSchema(devicesSchema, 'devices');

ajv.addSchema(allocationSchema, 'allocation');
ajv.addSchema(allocationsSchema, 'allocations');

const registerSchemaValidationMatcher = () => {
  expect.extend({
    toMatchSchema(received, schemaId) {
      const pass = ajv.validate(schemaId, received);
      if (pass) {
        return {
          message: () => `Expected data not to match the ${schemaId} schema`,
          pass: true,
        };
      }
      const errorsText = ajv.errorsText();
      return {
        message: () => `Expected data to match the ${schemaId} schema: ${errorsText}`,
        pass: false,
      };
    },
  });
};

export default registerSchemaValidationMatcher;
