/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/* eslint-disable no-underscore-dangle */
import Peer from 'peerjs';
import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import DateNowClock from 'dvbcss-clocks/src/DateNowClock';
import SyncProtocols from 'dvbcss-protocols';
import WallClockServerProtocol from 'dvbcss-protocols/src/WallClock/WallClockServerProtocol';
import { synchronisation } from '@bbc/audio-orchestration-core';

const { SyncAdapter } = synchronisation;

const { WallClockClientProtocol, BinarySerialiser } = SyncProtocols.WallClock;

class PeerSyncAdapter extends SyncAdapter {
  constructor({ sysClock = null } = {}) {
    super();
    this._sysClock = sysClock;
    if (this._sysClock === null) {
      this._sysClock = new DateNowClock();
    }
    this._connected = false;
    this._connectPromise = null;

    this._peer = null;
    this._connections = [];
    this._clocks = new Map();

    this._wallClockServerOptions = {
      precision: this._sysClock.dispersionAtTime(sysClock.now()),
      maxFreqError: this._sysClock.getRootMaxFreqError(),
      followup: true,
    };

    /**
     * Create a wall clock (units milliseconds)
     * @type {CorrelatedClock}
     */
    this._wallClock = new CorrelatedClock(this._sysClock, {
      tickRate: 1000,
    });
    this._wallClock.id = 'adapter-wallClock';
  }

  /**
   * Connects to the synchronisation service.
   *
   * @returns {Promise<PeerSyncAdapter>} a promise resolving when successfully connected.
   */
  connect(syncUrl /* TODO not used with default peer js server */, {
    sessionId,
    deviceId,
  }) {
    // The main device's deviceId is the same as the sessionId and used to address messages.
    // TODO: cloud-sync client does not need to know whether it is the main device, it just connects to the session.
    // Perhaps we should try using the given sessionId and if it's taken, instead connect to that peer.
    this._sessionId = sessionId;
    this._isMain = (sessionId === deviceId);

    console.log(this._isMain, sessionId, deviceId);

    if (this._connectPromise !== null) {
      return this._connectPromise;
    }

    this._connectPromise = new Promise((resolve, reject) => {
      this._peer = new Peer(deviceId, { debug: 2 });

      this._peer.on('open', () => {
        // if this is the main device, connecting to the peer server is all we need.
        if (this._isMain) {
          this.emit('connected');
        }
        resolve();
      });

      this._peer.on('disconnected', () => {
        // TODO disconnecting from the peer server may not be fatal - it's the connection to the
        // main device that's more critical. May be able to recover by calling peer.reconnect()
        // before passing this on as a failure on the main device.
        this.emit('disconnected');
        reject();
      });

      this._peer.on('connection', (conn) => {
        if (this._isMain) {
          console.debug(`got connection from ${conn.peer}`);
          conn.on('open', () => {
            // have to wait until connection is open before we can send messages etc.
            this._registerConnection(conn);
          });
        } else {
          // All other devices connect to the main device, so reject any connection attempts made
          // to an aux device.
          console.warning(`rejected connection attempt from ${conn.peer}`);
          conn.close();
        }
      });
    }).then(() => new Promise((resolve, reject) => {
      // wait until connected to the main device on aux devices
      if (!this._isMain) {
        console.log(`connecting to ${this._sessionId}`);
        const conn = this._peer.connect(this._sessionId);
        conn.on('open', () => {
          this._registerConnection(conn);
          this.connected = true;
          this.emit('connected');
          resolve();
        });

        conn.on('error', () => {
          reject();
        });
      } else {
        resolve();
      }
    })).then(() => this);
    return this._connectPromise;
  }

  _registerConnection(conn) {
    const { peer } = conn;
    this._connections.push(conn);

    let wcProtocolHandler;

    if (this._isMain) {
      wcProtocolHandler = new WallClockServerProtocol(
        this._wallClock,
        BinarySerialiser,
        this._wallClockServerOptions,
      );
    } else {
      wcProtocolHandler = new WallClockClientProtocol(
        this._wallClock,
        BinarySerialiser,
        {},
      );
    }

    wcProtocolHandler.start();

    wcProtocolHandler.on('send', (msg /* , dest */) => {
      conn.send({
        type: 'wallclock',
        content: msg,
      });
    });

    const handleClose = () => {
      console.log(`connection was closed to ${peer}`);

      wcProtocolHandler.stop();

      if (peer === this._sessionId) {
        this.connected = false;
        this.emit('disconnected');
        // TODO try to reconnect to main device?
      }

      // remove from list of active connections
      this._connections = this._connections.filter(c => c.peer !== peer);
      conn.close();

      this.emit('presence', {
        deviceId: peer,
        status: 'offline',
      });
    };

    conn.on('error', (e) => {
      console.log(`connection error ${peer}`, e);
      handleClose();
    });

    conn.on('close', (e) => {
      console.log(`connection close ${peer}`, e);
      handleClose();
    });

    // handleClose
    // TODO docs say Firefox does not support 'close' event

    conn.on('data', ({ type, content }) => {
      switch (type) {
        case 'wallclock':
          try {
            wcProtocolHandler.handleMessage(content);
          } catch (error) {
            // nothing we can do
          }
          break;
        case 'timeline':
          {
            const {
              update,
              subscribe,
            } = content;

            if (this._isMain && subscribe) {
              const { timelineId } = subscribe;

              if (this._clocks.has(timelineId)) {
                const { subscriptions } = this._clocks.get(timelineId);
                if (!subscriptions.find(c => c === conn)) {
                  subscriptions.push(conn);
                }
                // send update message
                // TODO make this a function as it's done in two places now
                const { clock } = this._clocks.get(timelineId);
                const { parentTime, childTime } = clock.getCorrelation();
                const speed = clock.getSpeed();

                conn.send({
                  type: 'timeline',
                  content: {
                    update: {
                      timelineId,
                      parentTime,
                      childTime,
                      speed,
                    },
                  },
                });
                // TODO remove subscription when device disconnects
              } else {
                // TODO what do do if the clock does not yet exist on main?
                // should still register the subscription.
                console.log('requested timelineId has not yet been registered');
              }
            } else if (!this._isMain && update) {
              const {
                timelineId,
                parentTime,
                childTime,
                speed,
              } = update;

              // TODO assuming that we only get updates for clocks we have requested
              const { clock } = this._clocks.get(timelineId);
              clock.setCorrelationAndSpeed({ parentTime, childTime }, speed);
              clock.setAvailabilityFlag(true);
            }
          }
          break;
        case 'broadcast':
          {
            const { topic, message } = content;
            this.emit('broadcast', {
              deviceId: peer,
              topic,
              content: message,
            });

            if (this._isMain) {
              // STAR topology forwarding of broadcast messages to all connected peers
              // TODO may not be necessary if all messages from aux are only intended for main.
              // TODO this also forwards it back to the sender.
              this._sendToAll(type, content);
            }
          }
          break;
        case 'presence':
          {
            const { deviceId, status } = content;
            this.emit('presence', {
              deviceId,
              status,
            });
          }
          break;
        default:
          console.debug(`received unexpected message type on data connection: ${type} from ${peer}.`);
      }
    });

    const presenceEvent = {
      deviceId: peer,
      status: 'online',
    };

    // emit the event on this device
    this.emit('presence', presenceEvent);

    // forward the event to all connected client if this is the main device
    if (this._isMain) {
      this._sendToAll('presence', presenceEvent);
    }

    // TODO technically reconnecting to the main device would mean we could continue?
    if (peer === this._sessionId) {
      this.connected = true;
      this.emit('connected');
    }
  }

  /**
   * Provides the underlying synchronised wall clock object.
   *
   * @returns {CorrelatedClock} wallClock
   * @public
   */
  get wallClock() {
    return this._wallClock;
  }

  /**
   * Registers a correlated clock to provide timeline updates to the
   * service, and receive updates from it.
   *
   * * Use this method for a main device client controlling the experience.
   * * Use {@link synchroniseToTimeline} for an auxiliary device client to wait until
   * another device provides a timeline to synchronise to.
   *
   * @param {CorrelatedClock} timelineClock
   * @param {string} timelineType
   * @param {string} contentId
   *
   * @returns {Promise<CorrelatedClock>}
   * @public
   */
  provideTimelineClock(timelineClock, timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('PeerSyncAdapter: provideTimelineClock: Not connected. Call connect() first.');
    }

    const timelineId = `${timelineType}-${contentId}`;
    console.log(`provideTimelineClock ${timelineId}`);

    if (this._clocks.has(timelineId)) {
      throw new Error(`Clock for timeline ${timelineId} is already registered.`);
    }

    const subscriptions = [];

    this._clocks.set(timelineId, {
      timelineId,
      contentId,
      type: timelineType,
      clock: timelineClock,
      subscriptions,
    });

    timelineClock.on('change', () => {
      const { parentTime, childTime } = timelineClock.getCorrelation();
      const speed = timelineClock.getSpeed();

      subscriptions.forEach((conn) => {
        try {
          conn.send({
            type: 'timeline',
            content: {
              update: {
                timelineId,
                parentTime,
                childTime,
                speed,
              },
            },
          });
        } catch (e) {
          console.log(`failed to send timeline update to ${conn.peer}`);
        }
      });
    });

    return this._connectPromise.then(() => timelineClock);
  }

  /**
   * Waits for a timeline of given type and contentId and provides a
   * CorrelatedClock for it when it becomes available.
   *
   * * Use this method for an auxiliary device client to be controlled by a remote timeline.
   * * Use {@link synchronise} for a main device client also providing updates to the server.
   *
   * @param {string} timelineType
   * @param {string} contentId
   * @param {number} timeout in seconds, the promise will be rejected after thisunless the clock is
   * available. Leave at 0 to not use a timeout.
   *
   * @return {Promise<CorrelatedClock>} resolving when the clock is available.
   * @public
   */
  requestTimelineClock(timelineType, contentId, timeout = 0) {
    if (this._connectPromise === null) {
      throw new Error('PeerSyncAdapter: requestTimelineClock: Not connected. Call connect() first.');
    }

    const timelineId = `${timelineType}-${contentId}`;

    // get the clock object to return, either previously stored or newly generated
    let timelineClock;
    if (this._clocks.has(timelineId)) {
      const { clock } = this._clocks.get(timelineId);
      timelineClock = clock;
    } else {
      // Create an initially unavailable clock object to return.
      // It will become available when the main device responds.
      timelineClock = new CorrelatedClock(this.wallClock, {
        available: false,
      });
      timelineClock.id = `timelineClock_${contentId}`;
      timelineClock.setSpeed(0);

      // TODO Should be sendToMain?
      this._sendToAll('timeline', {
        subscribe: {
          timelineId,
        },
      });
    }

    // check it doesn't already exist, because both provide and request are used on main device
    if (!this._clocks.has(timelineId)) {
      this._clocks.set(timelineId, {
        timelineId,
        contentId,
        type: timelineType,
        clock: timelineClock,
      });
    }

    return this._connectPromise.then(() => timelineClock).catch((e) => {
      throw new Error(`PeerSyncAdapter: requestTimelineClock: ${e.message}`);
    });
  }

  _sendToAll(type, content) {
    console.log(`Sending ${type} message to all ${this._connections.length} connections`);
    this._connections.forEach((conn) => {
      try {
        conn.send({ type, content });
      } catch (e) {
        console.warn(`PeerSyncAdapter: failed to send ${type} message to ${conn.peer}.`, e);
      }
    });
  }

  /**
   * Send a message to this topic to all devices in the same session.
   *
   * @param {string} topic
   * @param {object} message
   */
  sendMessage(topic, message) {
    this._sendToAll('broadcast', { topic, message });
    return Promise.resolve();
  }

  /**
   * Unregisters the client from Synchronisation Service
   */
  destroy() {
    this._connections.forEach((conn) => {
      conn.close();
    });

    if (this._peer) {
      this._peer.destroy();
    }
  }
}

export default PeerSyncAdapter;
