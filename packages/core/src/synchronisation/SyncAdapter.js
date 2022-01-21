/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/* eslint-disable no-unused-vars, class-methods-use-this */
import EventEmitter from 'events';

/**
 * The SyncAdapter is the interface betwen the {@link Synchroniser} and the networked
 * clock synchronisation and communication system.
 *
 * An implementation of the SyncAdapter interface described here provides primitives for:
 *
 * - getting access to a synchronised wall clock,
 * - connecting to (or starting) a session,
 * - sending messages to other devices in the same session,
 * - providing or subscribing to a synchronised timeline shared by all devices, and
 * - destroying the adapter (ie, disconnecting from the session and any servers).
 *
 * See example implementations of this interface in {@link CloudSyncAdapter} and
 * {@link PeerSyncAdapter}.
 */
class SyncAdapter extends EventEmitter {
  /**
   * Initialise the instance, for example by storing or creating the system clock, deriving a
   * synchronised wall clock, and initialising any book-keeping that may be needed before
   * connecting to a server.
   *
   * @param {CorrelatedClock} options.sysClock
   *
   */
  constructor({ sysClock = null }) {
    super();
  }

  /**
   * Provides the underlying synchronised wall clock object.
   *
   * @returns {CorrelatedClock} wallClock
   */
  get wallClock() { return undefined; }

  /**
   * Connects to the synchronisation service.
   *
   * @param {Object} syncEndpoint - an object describing all information needed to connect to the
   * sync service, such as a server address and port number.
   * @param {Object} sessionInfo
   * @param {string} sessionInfo.sessionId - identifier for the session to join or create
   * @param {string} sessionInfo.deviceId - identifier for the device represented by this instance
   * @param {boolean} sessionInfo.startSession - a flag to say that a session should be started
   * (true) or joined (false). Set to true on the main device, and false on auxiliary devices.
   *
   * @returns {Promise<SyncAdapter>} a promise resolving when successfully connected.
   */
  connect(syncEndpoint, { sessionId, deviceId, startSession }) {
    return Promise.resolve(this);
  }

  /**
   * Registers a correlated clock to provide timeline updates to the
   * service, and receive updates from it.
   *
   * Use this method for a main device client controlling the experience.
   *
   * Use {@link requestTimelineClock} for an auxiliary device client to wait until
   * another device provides the specified timeline to synchronise to.
   *
   * @param {CorrelatedClock} timelineClock
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @return {Promise<CorrelatedClock>}
   *
   */
  provideTimelineClock(timelineClock, timelineType, contentId) {}

  /**
   * Waits for a timeline of given type and contentId and provides a
   * CorrelatedClock for it when it becomes available.
   *
   * Use this method for an auxiliary device client to be controlled by a remote timeline.
   *
   * Use {@link provideTimelineClock} for a main device client also providing updates to the server.
   *
   * @param {string} timelineType
   * @param {string} contentId
   * @param {number} timeout in seconds, the promise will be rejected after this time if the clock
   * is still not available. Leave at 0 to not use a timeout.
   *
   * @return {Promise<CorrelatedClock>} resolving when the clock is available.
   */
  requestTimelineClock(timelineType, contentId, timeout = 0) {}

  /**
   * Send a message to this topic to all devices in the same session.
   *
   * @param {string} topic
   * @param {object} message
   */
  sendMessage(topic, message) {}

  /**
   * Unregisters the client from Synchronisation Service
   */
  destroy() {}
}

export default SyncAdapter;
