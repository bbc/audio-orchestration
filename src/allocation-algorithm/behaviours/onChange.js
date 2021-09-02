/* The onChange behaviour sets some flags that are then handled by
applyOnChangeBehaviour during the allocation algorithm
No changes are made to the lists
*/
const onChange = ({ behaviourParameters }) => {
  const flagsToAdd = ['onChange-applied'];

  const allStartOptions = [
    'canAlwaysStart',
    'canNeverRestart',
    'canOnlyStartOnFirstRun',
  ];

  const allAllocateOptions = [
    'moveToPreferred',
    'stayInPrevious',
    'moveToAllowedNotPrevious',
    'moveToAllowed',
  ];

  const {
    start = 'canAlwaysStart',
    allocate = allAllocateOptions,
  } = behaviourParameters;

  // Set flags based on start options
  if (allStartOptions.includes(start)) {
    flagsToAdd.push(`onChange-${start}`);
  } else {
    console.warn(`Invalid onChange start value: ${start}`);
  }

  // Set flags based on allocate options
  // Loop over values, see if it's valid, if it is then add a flag
  allocate.forEach((valueInAllocateList) => {
    if (allAllocateOptions.includes(valueInAllocateList)) {
      flagsToAdd.push(`onChange-${valueInAllocateList}`);
    } else {
      console.warn(`Unknown value in onChange allocate: ${valueInAllocateList}`);
    }
  });

  // Return the new flags
  return {
    flags: flagsToAdd,
  };
};

export default onChange;
