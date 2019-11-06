import Ajv from 'ajv';
import objectSchema from '../../../schemas/object.json';
import objectsSchema from '../../../schemas/objects.json';
import deviceSchema from '../../../schemas/device.json';
import devicesSchema from '../../../schemas/devices.json';
import allocationsSchema from '../../../schemas/allocations.json';
import allocationSchema from '../../../schemas/allocation.json';

const ajv = new Ajv();

ajv.addSchema(objectSchema, 'object');
ajv.addSchema(objectsSchema, 'objects');

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

