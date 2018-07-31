import React from 'react';
import PropTypes from 'prop-types';
import StartConnectionForm from './start-connection-form';
import StartChoice from './start-choice';
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

    if (connectVisible) {
      return (
        <StartConnectionForm
          onCancel={this.cancelConnect}
          onSubmit={this.submitConnect}
          numChars={SESSION_CODE_LENGTH}
        />
      );
    }

    return (
      <StartChoice
        startSession={startSession}
        joinSession={() => this.showConnect()}
      />
    );
  }
}

StartPage.propTypes = {
  startSession: PropTypes.func.isRequired,
  joinSession: PropTypes.func.isRequired,
};

export default StartPage;
