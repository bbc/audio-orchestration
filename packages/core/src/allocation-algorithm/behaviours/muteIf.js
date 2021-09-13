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
