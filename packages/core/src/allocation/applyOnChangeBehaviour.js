/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import {
  setDifference,
  setIntersection,
  setUnion,
} from './setOperations';

/** Function that adds all items in a set (or an array) to another set */
const addSetToSet = (setToAdd, targetSet) => {
  [...setToAdd].forEach((deviceId) => targetSet.add(deviceId));
};

/**
 * Change management: modify device allocation lists based on previous
 * allocation, acting on parameters of the onChange behaviour
 */
const applyOnChangeBehaviour = ({
  objectFlags,
  previousDevices,
  preferredDevices,
  allowedDevices,
  prohibitedDevices,
}) => {
  const preferredAndAllowedDevices = setUnion(preferredDevices, allowedDevices);

  // Check whether the object is allowed to start
  if (objectFlags.has('onChange-canOnlyStartOnFirstRun')
      && !objectFlags.has('onChange-objectWasInPreviousAllocation')) {
    addSetToSet(preferredAndAllowedDevices, prohibitedDevices);
    return;
  }

  if (
    objectFlags.has('onChange-canNeverRestart')
    && objectFlags.has('onChange-objectWasEverAllocated')
    && !objectFlags.has('onChange-objectWasInPreviousAllocation')
  ) {
    addSetToSet(preferredAndAllowedDevices, prohibitedDevices);
    return;
  }

  // If the code hasn't returned yet, check how the allocations should be
  // modified
  if (objectFlags.has('spread')) {
    // The object will continue to be allocated to any preferred or allowed
    // devices, or will stop playing if no such devices are available.
    return;
  }

  if (objectFlags.has('onChange-moveToPreferred')) {
    // If previous device is available in preferred
    if (setIntersection(preferredDevices, previousDevices).size > 0) {
      // Add to prohibited: all devices in preferred that are not in previous devices
      addSetToSet(setDifference(preferredDevices, previousDevices), prohibitedDevices);
      return;
    }

    // Previous device is not available in preferred
    // If there are any preferred devices
    if (preferredDevices.size > 0) {
      return;
    }
  }

  if (objectFlags.has('onChange-stayInPrevious')) {
    // If previous device is in preferred OR previous device is in allowed
    if (setIntersection(previousDevices, preferredAndAllowedDevices).size > 0) {
      // Add any device not in previous to prohibited
      addSetToSet(setDifference(preferredAndAllowedDevices, previousDevices), prohibitedDevices);
      return;
    }
  }

  if (objectFlags.has('onChange-moveToAllowedNotPrevious')) {
    // If there are any devices in preferred or allowed that are not in previouss
    if (setDifference(preferredAndAllowedDevices, previousDevices).size > 0) {
      // Add any device in previous to prohibited
      addSetToSet(previousDevices, prohibitedDevices);
      return;
    }
  }

  if (objectFlags.has('onChange-moveToAllowed')) {
    return;
  }

  // If the code still hasn't returned, then all devices prohibited
  // NOTE: Maybe this should be controlled with a flag onChange-allocateStop,
  // so that the default behaviour with an empty list of allocate parameters is
  // the same as with no onchange allowed
  addSetToSet(preferredAndAllowedDevices, prohibitedDevices);
};

export default applyOnChangeBehaviour;
