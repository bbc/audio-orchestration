import WebSocket from 'ws';
import url from 'url';

const PING_INTERVAL = 15000;

/**
 * A convenience class to be extended by our various servers. Provides some basic
 * services:
 *
 * - a map of socket connections to free-form data objects
 * - sending regular ping frames to all connected clients, to ensure the
 *   connections remain active.
 *
 * An instantiated sub class can be used by either calling {@link handleConnection}
 * directly when a new socket connects, or using {@link attachToServer}, to
 * register event handlers on a connect-like HTTP webserver.
 */
class WSServerBase {
  constructor(options) {
    /**
     * A dictionary mapping from a websocket representing a connection, to an
     * object storing attributes of that connection, such as the last time stamp
     * sent, and whether a setup message has been received.
     *
     * @type {Map<WebSocket, Object>}
     * @const
     * @private
     */
    this.connections = new Map();

    this.log = options.log || (() => {});

    setInterval(() => {
      this.pingAllClients();
    }, PING_INTERVAL);
  }

  /**
   * Called when a new client connects. Should be overridden.
   *
   * @abstract
   */
  onClientConnect(socket) {

  }

  /**
   * Called when a client disconnects, with the data stored with the connection.
   *
   * @abstract
   */
  onClientDisconnect(socket, connectionData) {

  }

  /**
   * Called when a message is received from the client.
   *
   * @abstract
   */
  onClientMessage(socket, message) {

  }

  /**
   * Handles a connection from a new client. The socket is added to the managed
   * list of connections, and message and close handlers are registered.
   *
   * @param {WebSocket} socket
   */
  handleConnection(socket) {
    this.connections.set(socket, {});

    socket.on('message', (message) => {
      this.handleMessage(socket, message);
    });

    socket.on('close', () => {
      this.handleClose(socket);
    });

    this.onClientConnect(socket);
  }

  /**
   * @private
   *
   * @param {WebSocket} socket
   * @param {ArrayBuffer} message
   */
  handleMessage(socket, message) {
    this.onClientMessage(socket, message);
  }

  /**
   * @private
   *
   * @param {WebSocket} socket
   */
  handleClose(socket) {
    this.onClientDisconnect(socket, this.connections.get(socket));
    this.connections.delete(socket);
  }

  /**
   * Creates a websocket server for this server, and attaches it to an HTTP server.
   * This setup process is the same for most of our custom servers, so for
   * convenience it is implemented in this common base class.
   *
   * @param {http.server} server
   * @param {string} endpoint - e.g. "/service"
   */
  attachToServer(server, endpoint) {
    // Create a websockets server, and register out connection handler on it.
    const wss = new WebSocket.Server({ noServer: true });
    wss.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    // Register an upgrade handler on the HTTP server. Upgrade events are emitted
    // when a client attempts to make a websocket connection. Then we check the path,
    // and if it matches the endpoint for this server, we forward the request to
    // the websocket server, which then forwards it to this custom server's
    // connection handler.
    server.on('upgrade', (request, socket, head) => {
      const { pathname } = url.parse(request.url);

      if (pathname === endpoint) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws);
        });
      }
    });

    console.log('registered upgrade handler');
  }

  /**
   * Sends a ping frame to each connected client. This should cause the connection
   * to close if the client has gone away.
   *
   * @private
   */
  pingAllClients() {
    this.connections.forEach((_, socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    });
  }

}

export default WSServerBase;
