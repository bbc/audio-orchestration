import React from 'react';
import MdoAllocation from 'bbcat-orchestration/src/mdo-allocation/';
import Device from './Device';

// whether or not the device location settings are rememberd after disconnecting the device
const DEFAULT_PERSIST_LOCATION = true;

class Allocations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      devices: [...new Array(props.numDevices)].map((d, i) => ({
        deviceId: `device-${i}`,
        enabled: (i === 0),
        mainDevice: (i === 0),
        location: {
          distance: null,
          direction: null,
        },
      })),
      allocations: {},
      persistLocation: DEFAULT_PERSIST_LOCATION,
    };
  }

  updateDeviceInfo(deviceId, { enabled, location }) {
    this.setState((prevState, props) => {
      const { mdoObjects } = props;
      const devices = prevState.devices.map((d) => {
        if (d.deviceId !== deviceId) {
          return d;
        }
        return Object.assign({}, d, {
          enabled,
          location: (prevState.persistLocation || enabled) ? location : {},
        });
      });
      const allocations = MdoAllocation.allocate(mdoObjects, devices, prevState.allocations);

      return Object.assign({}, prevState, {
        devices,
        allocations,
      });
    });
  }

  render() {
    const { devices, allocations } = this.state;
    return (
      <div>
        { devices.map(d => (
          <Device
            key={d.deviceId}
            deviceId={d.deviceId}
            mainDevice={d.mainDevice}
            location={d.location}
            enabled={d.enabled}
            updateDeviceInfo={deviceInfo => this.updateDeviceInfo(d.deviceId, deviceInfo)}
            activeObjects={allocations[d.deviceId] || []}
          />
        ))}
      </div>
    );
  }
}

export default Allocations;
