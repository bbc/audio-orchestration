/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/* eslint-disable no-underscore-dangle */
import Peer from 'peerjs';

import CorrelatedClock from 'dvbcss-clocks/src/CorrelatedClock';
import DateNowClock from 'dvbcss-clocks/src/DateNowClock';

import WallClockServerProtocol from 'dvbcss-protocols/src/WallClock/WallClockServerProtocol';
import SyncProtocols from 'dvbcss-protocols';

import SyncAdapter from '../synchronisation/SyncAdapter';

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
    this._isMain = false;

    this._syncEndpoint = {};
    this._peer = null;
    this._connections = [];
    this._clocks = new Map();

    this._wallClockServerOptions = {
      precision: this._sysClock.dispersionAtTime(sysClock.now()),
      maxFreqError: this._sysClock.getRootMaxFreqError(),
      followup: true,
    };

    this._wallClock = new CorrelatedClock(this._sysClock, {
      tickRate: 1000,
    });
    this._wallClock.id = 'adapter-wallClock';
  }

  _startSession() {
    // attempt to claim the session id as peer ID.
    // - Attempt to become the main device by using the session id as peer ID.
    // - Other devices connect to this session using a random device ID.
    return new Promise((resolve, reject) => {
      this._peer = new Peer(this._sessionId, {
        ...this._syncEndpoint,
        debug: 2,
      });

      this._peer.on('open', () => {
        // if this is the main device, connecting to the peer server is all we need.
        this._isMain = true;
        this.connected = true;
        this.emit('connected');
        // console.log(`main device connection open as ${this._sessionId}`);
        resolve();
      });

      this._peer.on('disconnected', () => {
        // TODO disconnecting from the peer server may not be fatal - it's the connection to the
        // main device that's more critical. May be able to recover by calling peer.reconnect()
        // before passing this on as a failure on the main device.

        // Only propagate this if this is the main device, ie we have connected successfully once.
        if (this._isMain) {
          this.connected = false;
          this.emit('disconnected');
        }
        reject();
      });
    }).then(() => {
      // Now accept connections from aux devices.
      this._peer.on('connection', (conn) => {
        conn.on('open', () => {
          // received a call from an aux to the main device.
          this._registerConnection(conn);
        });
      });
    });
  }

  _joinSession() {
    return new Promise((resolve, reject) => {
      this._peer = new Peer({
        debug: 2,
      });

      this._peer.on('error', () => {
        this.connected = false;
        this.emit('disconnected');
        reject();
      });

      this._peer.on('open', () => {
        // wait until connected to the main device on aux devices
        // console.log(`connecting to ${this._sessionId}`);
        const conn = this._peer.connect(this._sessionId, {
          metadata: {
            deviceId: this._deviceId,
          },
        });

        conn.on('open', () => {
          // the main device has picked up.
          this._registerConnection(conn);

          // after registerConnection has been called, this adapter is ready to receive calls from
          // outside so emit the connected event and resolve the promise.
          this.connected = true;
          this.emit('connected');
          // console.log('aux device connection open');
          resolve();
        });

        conn.on('error', () => {
          // console.log(`failed to connect to peer ${this._sessionId}`);
          this.connected = false;
          this.emit('disconnected');
          reject();
        });
      });
    });
  }

  connect(syncEndpoint = {}, {
    sessionId,
    deviceId,
    startSession,
  }) {
    this._syncEndpoint = syncEndpoint;
    // PeerJS identifiers can be alphanumeric with underscores and hyphens but must start and end
    // with a letter or number. Replacing all other characters here because the ID's generated in
    // the template also include colons.
    this._sessionId = sessionId.replace(/[^a-zA-Z0-9\-_]/g, '');

    // Also save the original device id which should be used when communicating presence events and
    // broadcast messages to the template.
    this._deviceId = deviceId;

    if (this._connectPromise === null) {
      if (startSession) {
        this._connectPromise = this._startSession().then(() => this);
      } else {
        this._connectPromise = this._joinSession().then(() => this);
      }
    }

    return this._connectPromise;
  }

  _registerConnection(conn) {
    const { peer, metadata = {} } = conn;
    this._connections.push(conn);

    let wcProtocolHandler;

    const { deviceId } = metadata;

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
      // console.log(`connection was closed to ${peer}`);

      wcProtocolHandler.stop();

      // remove from list of active connections
      this._connections = this._connections.filter((c) => c.peer !== peer);
      conn.close();

      this.emit('presence', {
        deviceId,
        status: 'offline',
      });

      // if it was the main device, and this is an aux device, emit the disconnected event.
      if (peer === this._sessionId) {
        // console.log('main device connection lost');
        this.emit('disconnected');
      }
    };

    conn.on('error', () => {
      // console.log(`connection error ${peer}`, e);
      handleClose();
    });

    // TODO docs say Firefox does not support 'close' event
    conn.on('close', () => {
      // console.log(`connection close ${peer}`, e);
      handleClose();
    });

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

            // console.debug(`got timeline message, update: ${update}, subscribe: ${subscribe}`);

            if (this._isMain && subscribe) {
              const { timelineId } = subscribe;

              if (this._clocks.has(timelineId)) {
                const { subscriptions } = this._clocks.get(timelineId);
                if (!subscriptions.includes(conn)) {
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
                // console.log('requested timelineId has not yet been registered');
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
            const { deviceId: broadcastDeviceId, topic, message } = content;
            // console.log(`got broadcast message ${topic}`);
            // TODO originating deviceID can be spoofed because it's taken from the message content,
            // but there is no direct link between deviceId and conn.peer anymore.
            this.emit('broadcast', {
              deviceId: broadcastDeviceId,
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
            const { deviceId: precenceDeviceId, status } = content;
            this.emit('presence', {
              deviceId: precenceDeviceId,
              status,
            });
          }
          break;
        default:
          // console.debug(`received unexpected message on data connection: ${type} from ${peer}.`);
      }
    });

    // console.log('register connection', conn, deviceId);

    const presenceEvent = {
      deviceId,
      status: 'online',
    };

    // emit the event on this device
    this.emit('presence', presenceEvent);

    // forward the event to all connected client if this is the main device
    if (this._isMain) {
      this._sendToAll('presence', presenceEvent);
    }
  }

  get wallClock() {
    return this._wallClock;
  }

  provideTimelineClock(timelineClock, timelineType, contentId) {
    if (this._connectPromise === null) {
      throw new Error('PeerSyncAdapter: provideTimelineClock: Not connected. Call connect() first.');
    }

    const timelineId = `${timelineType}-${contentId}`;
    // console.log(`provideTimelineClock ${timelineId}`);

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
          // console.log(`failed to send timeline update to ${conn.peer}`);
        }
      });
    });

    return this._connectPromise.then(() => timelineClock);
  }

  // TODO support timeout parameter
  requestTimelineClock(timelineType, contentId/* , timeout = 0 */) {
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
    // console.log(`Sending ${type} ${content.topic} message to ${this._connections.length} peers`);
    this._connections.forEach((conn) => {
      try {
        conn.send({ type, content });
      } catch (e) {
        // console.warn(`PeerSyncAdapter: failed to send ${type} message to ${conn.peer}.`, e);
      }
    });
  }

  sendMessage(topic, message) {
    this._sendToAll('broadcast', { deviceId: this._deviceId, topic, message });
    return Promise.resolve();
  }

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
