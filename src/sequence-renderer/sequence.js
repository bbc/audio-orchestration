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
 * @typedef {Object} MdoObject
 * @desc The MdoObject is a high level object that contains metadata used for placement decisions,
 * and audio items to be played at specific times.
 *
 * @property {string} objectId
 * @property {string} channelMapping should be "mono" or "left" or "right". Only used on the
 *                    'stereo' device. All objects are treated as mono on the MDO devices.
 * @property {MdoMetadata} orchestration
 * @property {Array<MdoSequenceItem>} items
 */

/**
 * @typedef {Object} MdoMetadata
 * @desc The MdoMetadata represents the S3A-style MDO metadata used for object placement decisions.
 *
 * @property {string} label
 *    human readable label
 * @property {number} objectNumber
 *    unique identifier used for cross referencing
 * @property {number} group
 *    only used in production tools to apply the same placement rules to all objects in a group
 * @property {number} mdoThreshold
 *    how many MDO devices are required before this object leaves the stereo mix
 * @property {number} mdoOnly
 *    whether this object only appears in MDO devices (never in stereo mix)
 * @property {number} mdoMethod
 *    not used (?)
 * @property {number} speakerNumber
 *    not used (?)
 * @property {number} diffuseness
 *    whether a decorrelation filter should be applied to this object
 * @property {number} mdoSpread
 *    whether the object should be allocated to all suitable devices
 * @property {number} mdoDynamic
 *    not used (?)
 * @property {number} mdoGainDB
 *    not used (?)
 * @property {number} muteIfObject
 *    disable this object if the referenced objectNumber is active on any device.
 * @property {number} exclusivity
 *    whether this object commands exclusive use of a device
 * @property {number} nearFront
 *    whether the object should be (3), could be (2), or can never (1) be in a near-front speaker.
 * @property {number} nearSide
 *    whether the object should be (3), could be (2), or can never (1) be in a near-side speaker.
 * @property {number} nearRear
 *    whether the object should be (3), could be (2), or can never (1) be in a near-rear speaker.
 * @property {number} farFront
 *    whether the object should be (3), could be (2), or can never (1) be in a far-front speaker.
 * @property {number} farSide
 *    whether the object should be (3), could be (2), or can never (1) be in a far-side speaker.
 * @property {number} farRear
 *    whether the object should be (3), could be (2), or can never (1) be in a far-rear speaker.
 * @property {number} above
 *    whether the object should be (3), could be (2), or can never (1) be in a above speaker.
 * @property {number} onDropin
 *    not used, affects strategy for resolving an additional device joining
 * @property {number} onDropout
 *    not used, affects strategy for resolving an active device leaving
 * @property {number} minQuality
 *    not used
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
 * @property {string} adaptationSetId only required for "dash".
 */

/**
 * @class Sequence
 *
 * @desc
 * A sequence describes all available objects, and the individual audio items that must be
 * scheduled to play them.
 *
 * An objectId describes the high-level MDO object, akin to an output channel. These objects
 * may be turned on or off in the sequence renderer at any time.
 *
 * There may be many non-overlapping playback items associated with the same object, if a source
 * track was mostly silence, and the items are stored as short buffer sources.
 *
 * This class wraps the {@link MdoSequence} and makes its properties more conveniently accessible.
 */
class Sequence {
  /**
   * Do not construct a Sequence directly, instead use {@link Sequence.deserialise}.
   * @param {MdoSequence} sequence
   * @private
   */
  constructor(sequence = {}) {
    /**
     * @type {MdoSequence}
     * @private
     */
    this._sequence = sequence;
  }

  /**
   * Deserialise a string representation of the sequence and return a Sequence object.
   *
   * @returns {Sequence}
   */
  static deserialise(str) {
    return new Sequence(JSON.parse(str));
  }

  /**
   * Serialise this sequence object as a string.
   *
   * @returns {string}
   */
  serialise() {
    return JSON.stringify(this._sequence);
  }

  /**
   * Provides a copy of all items that are or will be active at or after the given time.
   *
   * Even if two buffer items originated from the same channel, they will be treated as separate
   * playback items, but retain the same objectId.
   *
   * For looped sequences, you should request all items with after = 0.
   *
   * @param {string} objectId
   * @param {number} after
   *
   * @returns {Array[PlaybackItem]}
   */
  items(objectId, after = 0) {
    const object = this._sequence.objects.find(o => o.objectId === objectId);

    if (object === undefined) {
      return [];
    }

    // Find all items starting after the given time, or starting before and ending after.
    return object.items
      .map((item, i) => {
        const { start, duration } = item;
        const {
          type,
          url,
          adaptationSetId,
          channelMapping,
        } = item.source;

        return {
          itemId: `item-${objectId}-${i}`,
          objectId,
          start,
          duration,
          source: {
            type,
            url,
            adaptationSetId,
            channelMapping,
          },
        };
      })
      .filter(item => (item.start >= after ||
                       (item.start < after && item.start + item.duration >= after)));
  }

  /**
   * Gets a copy of the orchestration metadata for the object of the given id.
   *
   * @param {string} objectId
   *
   * @returns {MdoMetadata}
   */
  getOrchestrationData(objectId) {
    const object = this._sequence.objects.find(o => o.objectId === objectId);
    if (object === undefined) {
      return {};
    }
    return Object.assign({}, object.orchestration);
  }

  /**
   * Gets the declared duration of the sequence.
   *
   * @returns {number}
   */
  get duration() {
    return this._sequence.duration || 0;
  }

  /**
   * Gets the loop flag of the sequence.
   *
   * @returns {boolean}
   */
  get loop() {
    return this._sequence.loop || false;
  }

  /**
   * Get all objectIds used in this sequence
   *
   * @returns {Array<string>}
   */
  get objectIds() {
    return this._sequence.objects.map(object => object.objectId);
  }

  get objects() {
    // TODO deep copy?
    return this._sequence.objects.slice();
  }

  /**
   * Gets the next out point. If there are no defined out points after the given time, or no time is
   * specified, returns the duration of the sequence.
   *
   * @param {number} after - the time in seconds to select the next out point.
   * @param {boolean} wrap - if true, will wrap around and return the first out point instead, if
   * there are none after the given time.
   *
   * @returns {number}
   */
  nextOutPoint(after = null, wrap = false) {
    if (after === null) {
      return this.duration;
    }

    const next = this.outPoints
      .filter(o => o >= (wrap === false ? after : (after % this.duration)))
      .sort((a, b) => a - b)
      .shift();

    if (next === undefined) {
      return this.duration;
    }

    return next;
  }

  /**
   * Gets all out points defined for the sequence.
   *
   * @returns {Array<number>}
   */
  get outPoints() {
    if (Array.isArray(this._sequence.outPoints)) {
      return this._sequence.outPoints.slice();
    }
    return [];
  }

  /**
   * Finds the primary object from objects present in the list of given objects.
   *
   * TODO: The primary object is currently defined as the first (highest priority) active object
   * that has an imageUrl set.
   *
   * @param {Array<string>} objectIds - ids of objects to be considered in the search
   *
   * @returns {Object} ret
   * @returns {string} ret.primaryObjectId
   * @returns {string} ret.primaryObjectImageUrl
   */
  getPrimaryObjectInfo(objectIds) {
    return this._sequence.objects
      .filter(({ objectId }) => objectIds.includes(objectId))
      .filter(({ orchestration }) => orchestration.imageUrl !== null)
      .map(({ objectId, orchestration }) => ({
        primaryObjectId: objectId,
        primaryObjectImageUrl: orchestration.imageUrl,
      }))
      .find(true);
  }
}

export default Sequence;
