import { WallClock } from 'dvbcss-protocols';
import WSServerBase from './WSServerBase.js';

const createWcServer = WallClock.createBinaryWebSocketServer;

export class WallClockServer extends WSServerBase {
  constructor(wallClock, protocolOptions, serverOptions = {}) {
    super(serverOptions);
    this.wallClock = wallClock;
    this.protocolOptions = protocolOptions;
  }

  onClientConnect(socket) {
    socket.binaryType = 'arraybuffer'; // TODO the example does not need to set this.
    createWcServer(socket, this.wallClock, this.protocolOptions);
  }
}
