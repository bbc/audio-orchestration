/**
 * @typedef {Object} MdoAllocations
 *
 * @desc Represents the allocations determined by the {@link AllocationAlgorithm};
 * each `deviceId` key maps to a list of objects to play on that device. Each such object is
 * represented by its `objectId` and `gain`.
 */

/**
 * @typedef {Object} MdoDevice
 *
 * @desc Represents the metadata for a device taken into account by the
 * {@link AllocationAlgorithm}.
 *
 * @property {string} deviceId - Unique identifier for this device, automatically generated
 * @property {boolean} deviceIsMain - Whether it is the main device or an aux device
 * @property {string} deviceType - Device type, can be e.g. mobile, tablet, desktop, or unknown
 * @property {integer} deviceJoiningNumber - Original position in the joining order
 * @property {integer} deviceCurrentNumber - Current position in the joining order
 * @property {integer} deviceLatency - Emission delay, in milliseconds, if known
 * @property {number} deviceGain - Calibration gain multiplier to be applied to the output from the
 * device, if known
 * @property {Array<MdoControlSelection>} deviceControls - List of controls and their current
 * values for the device
 */

/**
 * @typedef {Object} MdoControlSelection
 *
 * @property {string} controlId
 * @property {Array} controlValues - array of strings or numbers representing all current selections
 * or the default value.
 */

/**
 * @typedef {Object} MdoBehaviour
 *
 * @desc Represents the metadata for a behaviour instance referenced in an {@link MdoObject}.
 *
 * @property {String} behaviourType - name registered with the {@link AllocationAlgorithm}
 * @property {Object} [behaviourParameters] - options for this instance of the behaviour
 */

/**
 * @typedef {Object} MdoObject
 *
 * @desc Represents the metadata for one object, including the properties and behaviour defining
 * where the object can be played, and the items pointing to the actual audio content.
 *
 * @property {String} objectId - Unique identifier for this object
 * @property {String} objectName - Human-readable name for this object
 * @property {Array<String>} objectLabels - Custom labels applied to the object for grouping
 * @property {Number} objectPan - Stereo panning position, -1 for full left, +1 for full right
 * @property {Number} objectGain - Gain multiplier
 * @property {String} objectImage - Application-specific reference to an image to display when this
 * object is rendered on a device
 * @property {Array<MdoBehaviour>} objectBehaviours - Behaviours for this object, they can affect
 * placement and rendering
 * @property {Array<MdoSequenceItem>} items - rendering items for the audio content of this object
 */


/**
 * @typedef {Object} MdoSequence
 * @desc The MdoSequence is the top level object describing the entire object scene.
 *
 * @property {Array<MdoObject>} objects
 * @property {number} duration
 * @property {boolean} loop
 * @property {Array<number>} outPoints
 */

/**
 * @typedef {Object} MdoSequenceItem
 * @desc The MdoSequenceItem represents an individual audio item - a stream or a file - to be played
 * back at a specific time on the Sequence timeline.
 *
 * @property {number} start
 * @property {number} duration
 * @property {MdoSequenceItemSource} source
 */

/**
 * @typedef {Object} MdoSequenceItemSource
 * @desc The MdoSequenceItemSource describes how the audio data for an {@link MdoSequenceItem} may
 * be obtained.
 *
 * @property {string} type should be "dash" or "buffer".
 * @property {string} url points to the DASH manifest or a plain audio file.
 * @property {string} safariUrl is the DASH manifest for Safari (if it needs a different encoding)
 * @property {string} adaptationSetId only required for "dash".
 */

/**
 * @typedef {Object} MdoControl
 * @desc A control specifies a user interface element for requesting some kind of input; and which
 * devices the control will be available on.
 *
 * @property {string} controlId - Unique identifier for this control.
 * @property {Array<MdoBehaviour>} controlBehaviours - List of behaviours for device allocation.
 * @property {string} [controlType] - type of control to be drawn, for UI
 * @property {string} [controlName] - human-readable name for the control, for UI
 * @property {Object} [controlParameters] - type-specific configuration for the control, for UI
 * @property {Array} [controlDefaultValues] - default values for the control, for UI
 */

/**
 * @typedef {Object} AllocationAlgorithmResults
 * @property {MdoAllocations} allocations
 * @property {number} runNumber
 * @property {Array<String>} objectIdsEverAllocated
 * @property {Object} [steps]
 */

