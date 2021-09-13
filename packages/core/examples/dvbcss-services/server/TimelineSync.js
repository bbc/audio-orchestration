import { TimelineSynchronisation } from 'dvbcss-protocols';
import WSServerBase from './WSServerBase.js';

const {
  PresentationTimestamp,
  PresentationTimestamps,
  ControlTimestamp,
  TSSetupMessage,
} = TimelineSynchronisation;


/**
 * The implementation of classes and methods in this file closely follows that
 * seen in pydvbcss.
 *
 * @see https://github.com/bbc/pydvbcss/blob/master/dvbcss/protocol/server/ts.py
 */

/**
 * Checks whether the given content identifier matches the given stem string.
 *
 * @param {string} ci
 * @param {string} stem
 */
function ciMatchesStem(ci, stem) {
  // TODO: Not sure where omit (pydvbcss.protocols.OMIT) comes from in javascript
  // land. Perhaps it is just undefined, as in Python it is used as an
  // initialiser for values that should not be sent.

  // if (ci === OMIT) {
  //   return false;
  // }

  return (ci !== undefined && ci.startsWith(stem));
}

/**
 * Checks whether the latest timestamp represents a change from the previous one.
 *
 * @param {ControlTimestamp} prev
 * @param {ControlTimestamp} latest
 */
function isControlTimestampChanged(prev, latest) {
  if (latest === undefined) {
    throw new Error('latest control timestamp is undefined.');
  }

  if (prev === undefined) {
    return true;
  }

  if (prev.contentTime === null && latest.contentTime === null) {
    return false;
  }

  if (prev.contentTime !== latest.contentTime) {
    return true;
  }

  if (prev.wallClockTime !== latest.wallClockTime) {
    return true;
  }

  if (prev.timelineSpeedMultiplier !== latest.timelineSpeedMultiplier) {
    return true;
  }

  return false;
}

/**
 * This server is compliant with the DVBCSS-TS protocol. Therefore it only deals
 * with connections from slave devices, which may subscribe to certain timeline
 * descriptors. Connections from master devices, publishing timeline updates,
 * must be handled separately. For each master connection, a TimelineSource may
 * be attached * to this server instance.
 *
 */
export class TimelineSyncServer extends WSServerBase {
  /**
   * @param {string} contentId
   * @param {CorrelatedClock} wallClock
   * @param {Object} serverOptions
   */
  constructor(contentId, wallClock, serverOptions) {
    super(serverOptions);

    /**
     * The content ID that this timeline sync server presents. Only clients
     * asking for a stem matching this id are accepted.
     *
     * @type {string}
     * @const
     * @private
     */
    this.contentId = contentId;

    /**
     * The same wall clock that is used by clients, and synchronised through the
     * {@link WallClockServer} connection.
     *
     * @type {CorrelatedClock}
     * @const
     */
    this.wallClock = wallClock;

    /**
     * A dictionary keeping track of which TimelineSource objects are currently
     * used.
     *
     * @type {Map<TimelineSource, bool>}
     * @const
     * @private
     */
    this.timelineSources = new Map();

    /**
     * A dictionary keeping track of how many clients are requesting each timeline
     * selector.
     *
     * @type {Map<string, number>}
     * @const
     * @private
     */
    this.timelineSelectors = new Map();
  }

  /**
   * Handles the setup message from a client that has already been added to the
   * connections.
   *
   * AptEptLpt (actual, earliest, latest) messages are not supported and ignored.
   *
   * @param {WebSocket} socket
   * @param {Object} message
   *
   * @private
   */
  onClientMessage(socket, message) {
    const connection = this.connections.get(socket);

    if (connection.setup === undefined) {
      let setupData;
      try {
        setupData = TSSetupMessage.deserialise(message);
      } catch (e) {
        this.log(`Expected a SetupData message, but decoding failed. got ${message}. error ${e}`);
        return;
      }

      connection.setup = setupData;
      connection.socket = socket;

      // Keep track of how many clients are requesting this timeline selector.
      const tSel = setupData.timelineSelector;
      if (this.timelineSelectors.has(tSel)) {
        this.timelineSelectors.set(tSel, this.timelineSelectors.get(tSel) + 1);
      } else {
        this.timelineSelectors.set(tSel, 1);
      }

      // If no one else was subscribing to tSel before, notify the sources that it is now needed.
      if (this.timelineSelectors.get(tSel) === 1) {
        this.timelineSources.forEach((_, src) => {
          src.timelineSelectorNeeded(tSel);
        });
      }

      // TODO: this.emit('clientsetup')
      this.updateClient(socket);
    } else {
      let aptEptLpt;
      try {
        aptEptLpt = PresentationTimestamps.deserialise(message);
      } catch (e) {
        this.log('Expected a valid AptEptLpt message, but decoding failed.');
        return;
      }
      connection.aptEptLpt = aptEptLpt;
      // TODO: this.emit('clientAptEptLpt')
    }
  }

  /**
   * Handles a new websocket connection, and registers event handlers on the socket.
   *
   * @param {WebSocket} socket
   */
  onClientConnect(socket) {
    this.log('TS Client connected.');
  }

  /**
   * Handles a closed socket.
   */
  onClientDisconnect(socket, connectionData) {
    const setupData = connectionData.setup;
    if (setupData) {
      const tSel = setupData.timelineSelector;
      this.timelineSelectors.set(tSel, this.timelineSelectors.get(tSel) - 1);

      if (this.timelineSelectors.get(tSel) === 0) {
        this.timelineSelectors.delete(tSel);
        this.timelineSources.forEach((_, source) => {
          source.timelineSelectorNotNeeded(tSel);
        });
      }
    }
  }

  /**
   * Attach a timeline source to this server, and register the server as a sink
   * on that source. All attached timeline sources will be checked for matching
   * a subscribed client's request.
   *
   * @param {TimelineSource} timelineSource
   */
  attachTimelineSource(timelineSource) {
    this.timelineSources.set(timelineSource, true);
    timelineSource.attachSink(this);
  }

  /**
   * Remove a timeline source and remove the server from its list of sinks.
   *
   * @param {TimelineSource} timelineSource
   */
  removeTimelineSource(timelineSource) {
    this.timelineSources.delete(timelineSource);
    timelineSource.removeSink(this);
  }

  /**
   * Update one specific client, but only if the new timestamp is different from
   * what was last sent to it.
   *
   * @param {WebSocket} socket
   * @private
   */
  updateClient(socket) {
    const connection = this.connections.get(socket);
    const { setup, prevCt } = connection;

    if (setup === undefined) {
      return;
    }

    let ct = new ControlTimestamp(new PresentationTimestamp(null, this.wallClock.now()), null);

    if (ciMatchesStem(this.contentId, setup.contentIdStem)) {
      this.timelineSources.forEach((_, src) => {
        if (src.recognisesTimelineSelector(setup.timelineSelector)) {
          ct = src.getControlTimestamp(setup.timelineSelector);
        }
      });
    }
    if (ct !== null && isControlTimestampChanged(prevCt, ct)) {
      connection.prevCt = ct;
      socket.send(ct.serialise());
    }
  }

  /**
   * Update all connected clients.
   */
  updateAllClients() {
    this.connections.forEach((_, socket) => {
      this.updateClient(socket);
    });
  }
}

export class TimelineSource {
  constructor() {
    /**
     * @type {Map<>}
     * @private
     */
    this.sinks = new Map();
  }

  /**
   * @abstract
   * @param {string} timelineSelector
   */
  /* eslint-disable-next-line class-methods-use-this */
  timelineSelectorNeeded(timelineSelector) {
    console.warn(`timelineSelectorNeeded not implemented. ${timelineSelector}`);
  }

  /**
   * @abstract
   * @param {string} timelineSelector
   */
  /* eslint-disable-next-line class-methods-use-this */
  timelineSelectorNotNeeded(timelineSelector) {
    console.warn(`timelineSelectorNotNeeded not implemented. ${timelineSelector}`);
  }

  /**
   * @abstract
   * @param {string} timelineSelector
   */
  /* eslint-disable-next-line class-methods-use-this */
  recognisesTimelineSelector(timelineSelector) {
    console.warn(`recognisesTimelineSelector not implemented. ${timelineSelector}`);
  }

  /**
   * @abstract
   */
  /* eslint-disable-next-line class-methods-use-this */
  getControlTimestamp() {
    console.warn('getControlTimestamp not implemented.');
  }

  /**
   * @param {TimelineSyncServer} sink
   */
  attachSink(sink) {
    this.sinks.set(sink, true);
  }

  /**
   * @param {TimelineSyncServer} sink
   */
  removeSink(sink) {
    this.sinks.delete(sink);
  }
}

/**
 * This Timeline Source subscribes to a correlated clock, and notifies all
 * subscribed sinks whenever that clock changes.
 */
export class SimpleClockTimelineSource extends TimelineSource {
  constructor(timelineSelector, wallClock, clock, {
    autoUpdateClients = false,
  }) {
    super();

    this.timelineSelector = timelineSelector;
    this.wallClock = wallClock;
    this.clock = clock;
    this.changed = true;
    this.latestCt = null;
    this.autoUpdateClients = autoUpdateClients;

    // TODO: we always subscribe to changes to these clocks, regardless of how
    // many sinks we have. The original code subscribes when the first sink is
    // added, and unsubscribes when the last is removed.
    this.wallClock.on('change', () => {
      this.notify();
    });

    this.clock.on('change', () => {
      this.notify();
    });
  }

  notify() {
    this.changed = true;
    if (this.autoUpdateClients) {
      this.sinks.forEach((_, sink) => {
        sink.updateAllClients();
      });
    }
  }

  recognisesTimelineSelector(timelineSelector) {
    return this.timelineSelector === timelineSelector;
  }

  /* eslint-disable-next-line no-unused-vars */
  getControlTimestamp(timelineSelector) {
    if (this.changed) {
      this.changed = false;

      if (this.clock.isAvailable()) {
        this.latestCt = new ControlTimestamp(
          this.clock.now(),
          this.wallClock.getNanos(),
          this.clock.speed,
        );
      } else {
        this.latestCt = new ControlTimestamp(null, this.wallClock.getNanos(), null);
      }
    }
    return this.latestCt;
  }
}
