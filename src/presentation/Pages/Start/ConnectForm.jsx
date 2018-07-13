import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import LinkButton from '../../Components/LinkButton';

class ConnectForm extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.state = { valid: false };

    this.submit = this.submit.bind(this);
    this.checkValid = this.checkValid.bind(this);
  }

  componentDidMount() {
    const { visible } = this.props;
    if (visible) {
      this.checkValid();
      this.inputRef.current.focus();
    }
  }

  componentDidUpdate(prevProps) {
    const { visible } = this.props;
    if (visible && !prevProps.visible) {
      this.checkValid();
      this.inputRef.current.focus();
    } else if (!visible && prevProps.visible) {
      this.checkValid();
      this.inputRef.current.value = '';
      this.inputRef.current.blur();
    }
  }

  checkValid() {
    const { numChars } = this.props;
    this.setState({ valid: this.inputRef.current.value.length === numChars });
  }

  submit() {
    const { onSubmit } = this.props;
    onSubmit(this.inputRef.current.value);
  }

  render() {
    const { visible, onCancel, numChars } = this.props;

    const { valid } = this.state;

    return (
      <div className={`modal modal-connect ${visible ? 'modal-visible' : ''}`}>
        <h1>
          Connect your device
        </h1>
        <p>
          Please enter the
          {numChars}
          -digit code displayed on your main device.
        </p>
        <input
          placeholder={'*'.repeat(numChars)}
          autoComplete="off"
          className="input-session-id"
          type="tel"
          maxLength={numChars}
          ref={this.inputRef}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              this.submit();
            }
          }}
          onChange={this.checkValid}
        />
        <p>
          <LargeButton onClick={this.submit} disabled={!valid} text="Connect" />
        </p>
        <p>
          <LinkButton onClick={onCancel} text="Cancel" />
        </p>
      </div>
    );
  }
}

ConnectForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
  numChars: PropTypes.number.isRequired,
};

export default ConnectForm;
