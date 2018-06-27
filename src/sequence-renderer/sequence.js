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
      .filter(item => (item.start >= after ||
                       (item.start < after && item.start + item.duration >= after)))
      .map((item) => {
        const { start, duration } = item;
        const {
          type,
          url,
          adaptationSetId,
          channelMapping,
        } = item.source;

        return {
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
      });
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
   * Gets the out-points of the sequence, if any.
   *
   * @returns {Array<number>}
   */
  get outPoints() {
    if (Array.isArray(this._sequence.outPoints)) {
      return this._sequence.outPoints.slice();
    }
    return [];
  }
}

export default Sequence;
