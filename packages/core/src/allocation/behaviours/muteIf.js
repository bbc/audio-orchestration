/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
*/
const muteIf = ({ behaviourParameters, allocations }) => ({
  postAllocationBehaviour: () => {
    const { objectId: otherObjectId } = behaviourParameters;

    const otherObjectWasAllocated = !!Object.values(allocations)
      .find((deviceAllocations) => deviceAllocations.find((a) => a.objectId === otherObjectId));

    if (otherObjectWasAllocated) {
      return { gain: 0 }; // linear gain
    }
    return {};
  },
});

export default muteIf;
