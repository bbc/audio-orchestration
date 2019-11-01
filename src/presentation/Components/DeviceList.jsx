import React from 'react';
import PropTypes from 'prop-types';
import LinkButton from './LinkButton';

// TODO add toggle to show device addition instructions on + click
import ConnectionInstructions from './ConnectionInstructions';

class DeviceList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      instructionsVisible: false,
    };
  }

  toggleInstructions(instructionsVisible) {
    this.setState(state => Object.assign({}, state, { instructionsVisible }));
  }

  render() {
    const {
      placeholderText,
      showInstructions,
      devices,
      sessionCode,
      baseUrl,
    } = this.props;
    const {
      instructionsVisible,
    } = this.state;

    return (
      <div>
        <ul className="device-list">
          { (devices.length === 0 && placeholderText !== '')
            ? (
              <li className="device-list-placeholder">
                { placeholderText }
              </li>
            )
            : null
          }
          { devices.map(({ deviceId, deviceType, deviceTemplateTag }) => (
            <li key={deviceId} className={`device-icon ${deviceType} ${deviceTemplateTag}`}>
              {`${deviceType} (${deviceTemplateTag})`}
            </li>
          ))}
          { showInstructions
            ? (
              <li className="device-list-add-button">
                <LinkButton
                  onClick={() => this.toggleInstructions(!instructionsVisible)}
                  text={instructionsVisible ? 'x' : '+'}
                />
              </li>
            )
            : null
          }
        </ul>
        { instructionsVisible
          ? (
            <ConnectionInstructions
              sessionCode={sessionCode}
              baseUrl={baseUrl}
            />
          )
          : null
        }
      </div>
    );
  }
}

DeviceList.defaultProps = {
  placeholderText: '',
  showInstructions: false,
  sessionCode: '',
  baseUrl: '',
};

DeviceList.propTypes = {
  placeholderText: PropTypes.string,
  showInstructions: PropTypes.bool,
  devices: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  sessionCode: PropTypes.string,
  baseUrl: PropTypes.string,
};

export default DeviceList;
