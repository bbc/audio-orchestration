/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

var EventEmitter = require("events");
var inherits = require('inherits');
var SyncProtocols = require("dvbcss-protocols");
var createWCSyncClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
var clocks = require("dvbcss-clocks");
var WeakMap = require("weak-map");
var parseUrl = require("url-parse");
var PRIVATE = new WeakMap();


/**
 * @constructor
 * @param wcServerUrl WallClock sync service (websocket) endpoint specification as a URL string
 * @param a CorrelatedClock object representing the wallclock to be synced
 */
var WallClockSynchroniser = function(wcServerUrl, wallclock){

  EventEmitter.call(this);

  PRIVATE.set(this, {});
  var priv = PRIVATE.get(this);

  const self = this;

  const url = parseUrl(wcServerUrl);

  Object.defineProperty(self, 'wallclock', { value: wallclock });

  priv.wsserver_url  = url.origin + url.pathname;
};

inherits(WallClockSynchroniser, EventEmitter);

/**
 *  start
 */
WallClockSynchroniser.prototype.start = function(){

  var priv = PRIVATE.get(this);

  // open a websocket connection with our WebSocket-to-UDP proxy
  priv.ws = new WebSocket(priv.wsserver_url);
  priv.ws.binaryType = 'arraybuffer';

  // when websocket is connected, create a WallClock sync client (which uses websockets) and start it
  priv.ws.addEventListener("open", function()
  {
    var priv = PRIVATE.get(this);

    // no need to pass a dest object, because we pass a socket, and dest is not used by the adapter in dvbcss-protocols.
    var protocolOptions = {};

    priv.wcSyncClient = createWCSyncClient(priv.ws, this.wallclock, protocolOptions);

    // no need to call priv.wcSyncClient.start(), protocol is automatically started if websocket is open
    // See sync-protocols/SocketAdaptors.WebSocketAdaptor
    // the wallclock is synced, if it emits a 'change' event (see dvbcss-clocks.CorrelatedClock)

  }.bind(this));

};


/**
 * stop()
 */
WallClockSynchroniser.prototype.stop = function(){
  var priv = PRIVATE.get(this);

  priv.wcSyncClient.stop();


};

module.exports = WallClockSynchroniser;
