var dgram = require("dgram");
var SyncProtocols = require("dvbcss-protocols");
var clocks = require("dvbcss-clocks");
var createClient = SyncProtocols.WallClock.createBinaryUdpClient; 
var sysClock = new clocks.DateNowClock();
var wallClock = new clocks.CorrelatedClock(sysClock);

var udpSocket = dgram.createSocket({type:'udp4', reuseAddr:true});

var protocolOptions = {
    dest: { address:"192.168.1.106", port:6677 }
};

udpSocket.on('listening', function() {
    var wcClient = createClient(udpSocket, wallClock, protocolOptions);

    setInterval(function() {
        console.log("WallClock = ",wallClock.now());
        console.log("dispersion = ",wallClock.dispersionAtTime(wallClock.now()));
    },1000);

});

udpSocket.bind();
