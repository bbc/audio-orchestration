var MockPersistance = require("./MockServiceState");
var DeviceMap = MockPersistance.ServiceState;
var Device = MockPersistance.Device;
var deviceMap = new DeviceMap();

var request = {
    sessionId: "123",
    deviceId: "456"
}

var session = deviceMap.getSession(request.sessionId);
if (session.indexOf(request.deviceId) < 0) {
    session.setDevice(new Device(request.deviceId));
    console.log("Registered device", request.deviceId, "for session", request.sessionId);
    console.log("Known devices in session", request.sessionId + ":", session.getDevicesIds());
}