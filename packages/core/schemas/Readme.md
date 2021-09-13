# JSON schema documents

The JSON schema documents define the structure of the object and device metadata used in the allocation algorithm.

* `device.json` and `devices.json` define the list of device metadata passed to the allocation algorithm.
* `object.json` and `objects.json` define the list of object metadata passed to the allocation algorithm.
* `allocation.json` and `allocations.json` define the device-object mappings with rendering metadata that are returned by the algorithm.

These schema definitions are used for automatically validating that a given object conforms to the expected schema in [tests](../test/) for the allocation algorithm.

Note that some of this information is replicated in [typedefs.js](../src/typedefs.js) to feed into the developer documentation; this file is currently kept in sync with the schema definitions manually.
