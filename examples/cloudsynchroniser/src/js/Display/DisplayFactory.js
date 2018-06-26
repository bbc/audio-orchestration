var ClockDisplay = require("./ClockDisplay"),
    DeviceInfoDisplay = require("./DeviceInfoDisplay"),
    SessionInfoDisplay = require("./SessionInfoDisplay"),
    PlayerInfoDisplay = require("./PlayerInfoDisplay"),
    PlayPositionDisplay = require("./PlayPositionDisplay"),
    displays, refreshRate, refreshTimeout;

displays = [];
refreshTimeout = null;

module.exports = {

    createClockDisplay: function (parent, name, object, toTimeString) {
        displays.push(new ClockDisplay(parent, name, object, toTimeString));
    },

    createDeviceInfoDisplay: function (parent, name, object) {
        displays.push(new DeviceInfoDisplay(parent, name, object));
    },

    createSessionInfoDisplay: function (parent, name, object) {
        displays.push(new SessionInfoDisplay(parent, name, object));
    },

    createPlayerInfoDisplay: function (parent, name, videoElement, videoClock) {
        displays.push(new PlayerInfoDisplay(parent, name, videoElement, videoClock));
    },

    createPlayPositionDisplay: function (parent, video, slider) {
        displays.push(new PlayPositionDisplay(parent, video, slider));
    },

    refreshAll: function (rate) {
        
        var refreshRate, i;
        
        refreshRate = rate || 200;

        displays.forEach(function (display) {
            display.refresh();
        });

        if (refreshTimeout !== null) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
        }
        refreshTimeout = setTimeout(this.refreshAll.bind(this), refreshRate);
    }
};