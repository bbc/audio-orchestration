var netutils = require("./netutils");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.urlencoded({ extended: false }));

var dgram = require("dgram");
var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createUDPServer = SyncProtocols.WallClock.createBinaryUdpServer;

var WebSocketServer = require("ws").Server;
const fs = require("fs");
const https = require("https");
var createWSServer = SyncProtocols.WallClock.createBinaryWebSocketServer;

const WCSYNC_UDP_PORT 	= 6677;
const WCSYNC_WS_PORT 	= 6676;
const WCSYNC_REST_PORT 	= 80;

console.log(typeof SyncProtocols.WallClock);



/**
 * Set up the local WallClock based on a monotonic time source
 */
var sysClock = new clocks.DateNowClock(); // system clock
var wallClock = new clocks.CorrelatedClock(sysClock); // wall clock

// estimate precision of the DateNowClock
var precision = sysClock.dispersionAtTime(sysClock.now());

// CSS-WC protocol options
var protocolOptions = {
	precision: sysClock.dispersionAtTime(sysClock.now()),
	maxFreqError: sysClock.getRootMaxFreqError(),
	followup: true
};

/**
 * Determine host IP address
 */
var host_ifs = netutils.getLocalIPs();
var host_ipaddr = (host_ifs.eth0) || (host_ifs.en0) || (host_ifs.enp0s3);


/**
 * Create a UDP-based CSS-WC protocol server
 */
var udpSocket = dgram.createSocket({type:"udp4", reuseAddr:true});
var wcUdpServer;
udpSocket.on("listening", function() {
    wcUdpServer = createUDPServer(udpSocket, wallClock, protocolOptions);

    var address = udpSocket.address();
    console.log("wallclock udp server listening at %s:%d",host_ipaddr.IPv4, address.port);

});

udpSocket.bind(WCSYNC_UDP_PORT);

/**
 * Create a WebSocket-based CSS-WC protocol server
 */
const https_server = new https.createServer({
	cert: fs.readFileSync("/usr/src/wallclockservice/config/certs/mqttbroker_server.crt"),
	key: fs.readFileSync("/usr/src/wallclockservice/config/certs/mqttbroker_server.key")
});



var wsServer = new WebSocketServer({ server: https_server });
var wcWebSocketServer;
var wcWSServers = [];
wsServer.on("connection", function connection(ws) {

	wcWebSocketServer = createWSServer(ws, wallClock, protocolOptions);
	wcWSServers.push (wcWebSocketServer);
	console.log("Handler created for new websocket connection");

});

https_server.listen(WCSYNC_WS_PORT);

console.log("WallClock websocket+binary server listening at %s:%d.", host_ipaddr.IPv4, WCSYNC_WS_PORT);

/**
 * Create a REST API server using express
 */
var rest_api_server = app.listen(WCSYNC_REST_PORT, function () {

	var host = rest_api_server.address().address;
	var port = rest_api_server.address().port;

	console.log("WallClock REST service listening at http://%s:%s ...", host_ipaddr.IPv4, port);

});




app.get("/", function(req, res) {

	var wcSyncUdpUrl = wcUdpServer.isStarted() ? host_ipaddr.IPv4 + ":"+ WCSYNC_UDP_PORT :"";
//	console.log(wcSyncUdpUrl);
	var wcSyncWSUrl= "ws://"+ host_ipaddr.IPv4 + ":" + WCSYNC_WS_PORT;

	res.writeHead(200, {"Content-Type": "application/json"});

	  var anObject = { wcsync_url_ws: wcSyncWSUrl, wcsync_url_udp:  "udp://" +wcSyncUdpUrl, currentTimeNanos: wallClock.getNanos(), dispersionSecs:  wallClock.dispersionAtTime(wallClock.now())};
	  var json = JSON.stringify(anObject);
	  res.end(json);

});
