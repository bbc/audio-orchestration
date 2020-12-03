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
      .map((item, i) => ({
        ...item,
        itemId: `item-${objectId}-${i}`,
        objectId,
      }));
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
   * that has an image property set.
   *
   * @param {Array<string>} objectIds - ids of objects to be considered in the search
   *
   * @returns {Object} ret
   * @returns {string} ret.primaryObjectId
   * @returns {string} ret.primaryObjectImage
   */
  getPrimaryObjectInfo(objectIds) {
    return this._sequence.objects
      .filter(({ objectId }) => objectIds.includes(objectId))
      .filter(({ objectImage }) => !!objectImage)
      .map(({ objectId, objectImage }) => ({
        primaryObjectId: objectId,
        primaryObjectImage: objectImage,
      }))
      .find(() => true);
  }
}

export default Sequence;
