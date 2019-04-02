var WebSocket = require("ws");
var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);

var ws = new WebSocket("wss://192.168.1.79:6676");
var protocolOptions = {
    dest: { address:"wss://192.168.1.79:6676", port:6676, format: { binary: true, mask: true }},
};


ws.on("open", function() {
    var wcClient = createClient(ws, wallClock, protocolOptions);

    setInterval(function() {
        console.log("WallClock = ",wallClock.now());
        console.log("dispersion = ",wallClock.dispersionAtTime(wallClock.now()));
    },1000);

});
