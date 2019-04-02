var WeakMap = require("weak-map");
var Session = require("./MockSessionState");
var Device = require("./MockDeviceState");
var PRIVATE = new WeakMap();

var ServiceState = function () {
	PRIVATE.set(this, {
		sessions: []
    });
    console.log("Created new device map");
};

ServiceState.prototype.getSession = function (sessionId) {

    var priv, res;
    
    res = null;
    priv = PRIVATE.get(this);

	priv.sessions.forEach(function (session) {
        if (session.id === sessionId) {
            res = session;
        }
    });

    if (res === null) {
        res = new Session(sessionId);
        priv.sessions.push(res);
        console.log("Created new Session:", res.id);
    }

    return res;
};

module.exports = {
    ServiceState: ServiceState,
    Device: Device
}