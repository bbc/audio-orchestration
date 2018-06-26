var Session, WeakMap, PRIVATE;

WeakMap = require("weak-map");
PRIVATE = new WeakMap;

Session = function (sessionId) {
	PRIVATE.set(this, {
        id: sessionId,
        devices: []
	});
}

Object.defineProperties(Session.prototype, {
    "id": {
        get: function () { return PRIVATE.get(this).id; }
    }
});

Session.prototype.indexOf = function (deviceId) {
    
    var priv, res;
    
    priv = PRIVATE.get(this);
    res = -1;

    priv.devices.forEach(function (device, i) {
        if (device.deviceId === deviceId) {
            res = i;
        }
    });

    return res;
};

Session.prototype.setDevice = function (device) {
    
    var priv, i;
    
    priv = PRIVATE.get(this);
    i = this.indexOf(device);
    
    if (i < 0) {
        priv.devices.push(device);
    }

    else {
        priv.devices[i] = device;
    }
};

Session.prototype.getDevice = function (deviceId) {

    var priv, res;
    
    priv = PRIVATE.get(this);
    res = null;

    priv.devices.forEach(function (device) {
        if (device.deviceId === deviceId) {
            res = device;
        }
    });

    return res;
}

Session.prototype.getDevices = function () {
    return [].concat(PRIVATE.get(this).devices); // Return copy
};

Session.prototype.getDevicesIds = function () {
    return this.getDevices().map(function (d) { return d.deviceId; });
}

Session.prototype.removeDevice = function (deviceId) {
    var devices = PRIVATE.get(this).devices;
    PRIVATE.get(this).devices = devices.filter(function (dev) {
        if (deviceId !== dev.deviceId) { return true; }
        else { return false; }
    });
};

module.exports = Session;