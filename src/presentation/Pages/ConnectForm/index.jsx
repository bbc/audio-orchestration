import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import LinkButton from '../../Components/LinkButton';
import StepProgressIndicator from '../../Components/StepProgressIndicator';
import config from '../../../config';

class ConnectFormPage extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.state = { valid: false };

    this.submit = this.submit.bind(this);
    this.checkValid = this.checkValid.bind(this);

    this.validRegex = /^[0-9]+$/;
  }

  componentDidMount() {
    this.checkValid();
    this.inputRef.current.focus();
  }

  componentDidUpdate(prevProps) {
    const { sessionCodeIsValidating } = this.props;
    // if the code has just been validated.
    if (prevProps.sessionCodeIsValidating && !sessionCodeIsValidating) {
      this.inputRef.current.value = '';
      this.inputRef.current.focus();
    }
  }

  componentWillUnmount() {
    this.inputRef.current.blur();
  }

  checkValid() {
    const userInput = this.inputRef.current.value;
    const sanitised = userInput.replace(/[^0-9]/g, '');
    this.inputRef.current.value = sanitised;
    this.setState({
      valid: (sanitised.length === config.SESSION_CODE_LENGTH)
          && (sanitised.match(this.validRegex) !== null),
    });
  }

  submit() {
    const { connectFormOnSubmit } = this.props;
    connectFormOnSubmit(this.inputRef.current.value);
  }

  render() {
    const {
      sessionCodeIsValid,
      sessionCodeIsValidating,
      connectFormCanCancel,
      connectFormOnCancel,
    } = this.props;
    const { valid } = this.state;

    return (
      <div className="page page-start">
        <h1>
          Connect your device
        </h1>
        <p>
          { `Please enter the ${config.SESSION_CODE_LENGTH}-digit code displayed on your main device.` }
        </p>
        { !sessionCodeIsValid
          ? (
            <p style={{ color: 'red' }}>
              Invalid code entered, please try again.
            </p>
          )
          : null
        }
        <p>
          <input
            placeholder={'*'.repeat(config.SESSION_CODE_LENGTH)}
            autoComplete="off"
            className="input-session-id"
            type="tel"
            maxLength={config.SESSION_CODE_LENGTH + 1}
            ref={this.inputRef}
            disabled={sessionCodeIsValidating}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                this.submit();
              }
            }}
            onChange={this.checkValid}
          />
        </p>
        <p>
          { sessionCodeIsValidating
            ? <LargeButton disabled text="Checking&hellip;" />
            : <LargeButton onClick={this.submit} disabled={!valid} text="Connect" />
          }
        </p>
        { connectFormCanCancel
          ? (
            <p>
              <LinkButton onClick={connectFormOnCancel} text="Cancel" />
            </p>
          )
          : null
        }
        <StepProgressIndicator step={1} numSteps={3} />
      </div>
    );
  }
}

ConnectFormPage.propTypes = {
  connectFormOnSubmit: PropTypes.func.isRequired,
  connectFormOnCancel: PropTypes.func.isRequired,
  connectFormCanCancel: PropTypes.bool.isRequired,
  sessionCodeIsValidating: PropTypes.bool.isRequired,
  sessionCodeIsValid: PropTypes.bool.isRequired,
};

export default ConnectFormPage;
