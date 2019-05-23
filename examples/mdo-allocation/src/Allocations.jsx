import React from 'react';
import { allocate } from '../../../src/mdo-allocation';
import Device from './Device';
import NotRenderedDevice from './NotRenderedDevice';

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
        location: null,
      })),
      allocations: {},
      persistLocation: DEFAULT_PERSIST_LOCATION,
    };
  }

  updateDeviceInfo(deviceId, { enabled, location }) {
    this.setState((prevState, props) => {
      const { objects } = props;
      const devices = prevState.devices.map((d) => {
        if (d.deviceId !== deviceId) {
          return d;
        }
        return Object.assign({}, d, {
          enabled,
          location: (prevState.persistLocation || enabled) ? location : null,
        });
      });
      const allocations = allocate(objects, devices, prevState.allocations);

      // merge previous state and updated properties
      return Object.assign({}, prevState, {
        devices,
        allocations,
      });
    });
  }

  resetPreviousAllocations() {
    this.setState((prevState, props) => {
      const { objects } = props;
      const { devices } = prevState;
      const allocations = allocate(objects, devices, {});

      // merge previous state and updated properties
      return Object.assign({}, prevState, {
        allocations,
      });
    });
  }

  render() {
    const { devices, allocations } = this.state;
    const { visibleObjects, setObjectVisible } = this.props;

    return (
      <table>
        <thead>
          <tr>
            <td colSpan="4">
              <button type="button" onClick={() => this.resetPreviousAllocations()}>
                Reset previous allocations
              </button>
            </td>
          </tr>
        </thead>
        <tbody>
          { devices.map(d => (
            <Device
              key={d.deviceId}
              deviceId={d.deviceId}
              mainDevice={d.mainDevice}
              location={d.location}
              enabled={d.enabled}
              updateDeviceInfo={deviceInfo => this.updateDeviceInfo(d.deviceId, deviceInfo)}
              allocations={allocations}
              visibleObjects={visibleObjects}
              setObjectVisible={setObjectVisible}
            />
          ))}
          <NotRenderedDevice
            allocations={allocations}
            visibleObjects={visibleObjects}
            setObjectVisible={setObjectVisible}
          />
        </tbody>
      </table>
    );
  }
}

export default Allocations;
