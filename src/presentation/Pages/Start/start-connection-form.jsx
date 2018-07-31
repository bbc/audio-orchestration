import React from 'react';
import PropTypes from 'prop-types';
import LargeButton from '../../Components/LargeButton';
import LinkButton from '../../Components/LinkButton';

class StartConnectionForm extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.state = { valid: false };

    this.submit = this.submit.bind(this);
    this.checkValid = this.checkValid.bind(this);
  }

  componentDidMount() {
    this.checkValid();
    this.inputRef.current.focus();
  }

  componentWillUnmount() {
    this.inputRef.current.blur();
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
    const { onCancel, numChars } = this.props;

    const { valid } = this.state;

    return (
      <div className="page page-start">
        <h1>
          Connect your device
        </h1>
        <p>
          { `Please enter the ${numChars}-digit code displayed on your main device.` }
        </p>
        <p>
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
        </p>
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

StartConnectionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  numChars: PropTypes.number.isRequired,
};

export default StartConnectionForm;
