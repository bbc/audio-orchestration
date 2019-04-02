//var ReconnectingWebSocket = require('reconnectingwebsocket');
// const WALLCLOCK_SERVICE_HOST = "wallclock-service.virt.ch.bbc.co.uk"
const WALLCLOCK_SERVICE_HOST = "wss://wallclock-service.2immerse.edge.platform.2immerse.local"
const WALLCLOCK_SERVICE_PORT = 80

var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);

var wcSyncClient;
var ws;
var protocolOptions = {
		dest: { address:"wss://wallclock-service.2immerse.edge.platform.2immerse.local", port:6676},
};
console.log(protocolOptions);

var onLoadFunc = function() {
	console.log("onload");
	initWCSync(protocolOptions.dest.address);  // url of proxy server endpoint
};

window.onload = onLoadFunc;


var initWCSync = function(serverUrl) {

	ws = new WebSocket("wss://wallclock-service.2immerse.edge.platform.2immerse.local", "WallClockSync");
	ws.binaryType = 'arraybuffer';
	ws.addEventListener("open", createWCSyncClient);
	setInterval(updateUI, 200);
}


var createWCSyncClient = function() {
	console.log(protocolOptions);
	wcSyncClient = createClient(ws, wallClock, protocolOptions);

		setInterval(function() {
				console.log("WallClock = ",wallClock.now());
				console.log("dispersion = ",wallClock.dispersionAtTime(wallClock.now()));
		},1000);

}


var updateUI = function()
{
	var nowNanos = wallClock.getNanos();
	document.getElementById("nanos").innerHTML = nowNanos;

	var date = new Date(nowNanos/1000000);
	// Hours part from the timestamp
	var hours = date.getHours();
	// Minutes part from the timestamp
	var minutes = "0" + date.getMinutes();
	// Seconds part from the timestamp
	var seconds = "0" + date.getSeconds();

	var milliseconds = + date.getMilliseconds();

	// Will display time in 10:30:23 format
	var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + " " + milliseconds;
	document.getElementById("timeOfDay").innerHTML = formattedTime;
	document.getElementById("dispersion").innerHTML = wallClock.dispersionAtTime(wallClock.now());
};
