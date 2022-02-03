/* eslint-disable */

import ClockBase from 'dvbcss-clocks/src/ClockBase';

/**
 * It is a subclass of ClockBase from dvbcss-clocks.
 *
 * This clock is a root clock for the clocks-hierarchy based on the AudioContext
 * currentTime. currentTime is provided in seconds already.
 *
 * A precision of 2ms is hardcoded, as this clock's precision cannot be measured
 * in a tight loop - the AudioContext.currentTime always reports the same value
 * within the event loop iteration.
 *
 */
export default class AudioContextClock extends ClockBase {
  /**
   * @param {Object} options
   * @param {number} options.tickRate
   * @param {number} options.maxFreqErrorPpm
   * @param {AudioContext} context
   */
  constructor(options, context) {
    super(options);

    /** @type {number} */
    this.freq = options.tickRate || 1000;

    /** @type {number} */
    this.maxFreqErrorPpm = options.maxFreqErrorPpm || 50;

    /** @type {number} */
    this.precision = 2 / 1000;

    /** @type {AudioContext} */
    this.context = context;
  }

  now() {
    return (this.context.currentTime) * this.freq;
  }

  getTickRate() {
    return this.freq;
  }

  calcWhen(t) {
    return (t / this.freq);
  }

  toParentTime(t) {
    throw 'no parent';
  }

  fromParentTime(t) {
    throw 'no parent';
  }

  getParent() {
    return null;
  }

  setParent(newParent) {
    throw 'cannot set a parent';
  }

  setAvailabilityFlag(availability) {
    if (!availability) {
      throw 'Cannot change availability';
    }
  }

  _errorAtTime(t) {
    return this.precision;
  }

  getRootMaxFreqError() {
    return this.maxFreqErrorPpm;
  }
}
