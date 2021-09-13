import React from 'react';
import NamedList from './NamedList';
import Flag from './Flag';

class DeviceItem extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      device,
      deviceState = {},
      active,
    } = this.props;

    return (
      <div className={`device ${active ? 'active' : ''}`}>
        <h2>
          Device
          {' '}
          {device.deviceId}
        </h2>
        { deviceState.objects
          ? (
            <div className="flex-row">
              <NamedList name="Allocated Objects" items={deviceState.objects} />
            </div>
          ) : null }
        { deviceState.flags
          ? (
            <p>
              { deviceState.flags.map((flag) => (
                <Flag name={flag.name} value={flag.value} key={flag.name} />
              ))}
            </p>
          ) : null }
      </div>
    );
  }
}

export default DeviceItem;
