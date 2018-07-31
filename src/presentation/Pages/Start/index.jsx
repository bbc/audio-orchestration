import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import ConnectForm from './ConnectForm';
import { SESSION_CODE_LENGTH } from '../../../config';

class StartPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connectVisible: false,
    };

    this.showConnect = this.showConnect.bind(this);
    this.cancelConnect = this.cancelConnect.bind(this);
    this.submitConnect = this.submitConnect.bind(this);
  }

  showConnect() {
    this.setState({
      connectVisible: true,
    });
  }

  cancelConnect() {
    this.setState({
      connectVisible: false,
    });
  }

  submitConnect(sessionCode) {
    const { joinSession } = this.props;
    joinSession(sessionCode);
    this.cancelConnect();
  }

  render() {
    const {
      startSession,
    } = this.props;

    const {
      connectVisible,
    } = this.state;

    return (
      <div className="page page-start">
        <div className="gel-layout">
          <div className="gel-1/1">
            <h1>
              bbcat-orchestration-template
            </h1>

            <p>
              You can modify these components, and the main.scss stylesheet, to customise the
              interface.
            </p>
          </div>
        </div>

        <div className="gel-layout">
          <div className="gel-1/1">
            <p>
              <LargeButton
                text="Create Session"
                secondaryText="Start on the device with the best speakers."
                onClick={startSession}
              />
            </p>
            <p>
              <LargeButton
                text="Join"
                secondaryText="Connect this device as an auxiliary speaker."
                onClick={this.showConnect}
              />
            </p>
          </div>
        </div>

        <ConnectForm
          onCancel={this.cancelConnect}
          onSubmit={this.submitConnect}
          visible={connectVisible}
          numChars={SESSION_CODE_LENGTH}
        />
      </div>
    );
  }
}

StartPage.propTypes = {
  startSession: PropTypes.func.isRequired,
  joinSession: PropTypes.func.isRequired,
};

export default StartPage;
