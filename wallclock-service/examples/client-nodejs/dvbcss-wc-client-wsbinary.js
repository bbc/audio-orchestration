var WebSocket = require('ws');
var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createClient = SyncProtocols.WallClock.createBinaryWebSocketClient;
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);

var ws = new WebSocket('wss://wallclock-service.2immerse.edge.platform.2immerse.local');


var protocolOptions = {
    dest: { address:"wss://wallclock-service.2immerse.edge.platform.2immerse.local", port:443, format: { binary: true, mask: true }},
};



ws.on("error", (err)=>{
    console.log(err);
});


ws.on('open', function() {
    var wcClient = createClient(ws, wallClock, protocolOptions);

    setInterval(function() {
        console.log("WallClock = ",wallClock.now());
        console.log("dispersion = ",wallClock.dispersionAtTime(wallClock.now()));
    },1000);

});
