import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import config from 'config';
import Button from 'components/button/Button';
import PageFiller from 'components/page-filler/PageFiller';
import PageContents from 'components/page-contents/PageContents';
import Input from 'components/input/Input';

import {
  connectFormOnCancel,
  connectFormOnSubmit,
} from 'actions';

const validRegex = /^[0-9]+$/;

const ConnectFormPage = ({
  onSubmit,
  onCancel,
  canCancel,
  sessionCodeIsValid,
  sessionCodeIsValidating,
}) => {
  // Use state for storing the current sanitised input and whether it is valid (right length)
  const [sanitisedInput, setSanitisedInput] = useState('');
  const [valid, setValid] = useState(false);

  // Get a ref to pass to the input component, so we can access the underlying DOM element
  const inputRef = useRef();

  // Function to validate the input and store the sanitised input
  const validateInput = () => {
    if (!inputRef.current) return;

    const userInput = inputRef.current.value;
    const sanitised = userInput.replace(/[^0-9]/g, '');

    setSanitisedInput(sanitised);

    setValid(
      (sanitised.length === config.SESSION_CODE_LENGTH)
      && (sanitised.match(validRegex) !== null),
    );
  };

  // Focus the input element when the page is rendered for the first time
  useEffect(() => {
    if (!inputRef) return;

    inputRef.current.focus();
  }, [inputRef]);

  return (
    <div
      className={classnames(
        'page',
        'page-connect-form',
        // 'page-with-status-bar',
      )}
    >
      <PageContents>
        <h1>
          Connect your device
        </h1>

        <p>
          { `Please enter the ${config.SESSION_CODE_LENGTH}-digit code displayed on your main device.` }
        </p>

        { !sessionCodeIsValid
          ? (
            <p>
              Invalid code, please try again.
            </p>
          )
          : null}

        <p>
          <Input
            placeholder={'*'.repeat(config.SESSION_CODE_LENGTH)}
            autoComplete="off"
            type="tel"
            maxLength={config.SESSION_CODE_LENGTH + 1}
            ref={inputRef}
            disabled={sessionCodeIsValidating}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && valid) {
                onSubmit(sanitisedInput);
              }
            }}
            onChange={validateInput}
            value={sanitisedInput}
            fluid
            error={!sessionCodeIsValid}
          />
        </p>

        <p>
          { sessionCodeIsValidating
            ? <Button disabled content="Checking&hellip" fluid />
            : <Button disabled={!valid} onClick={() => onSubmit(sanitisedInput)} content="Connect" fluid />}
        </p>

        { canCancel
          ? (
            <p>
              <Button
                content="Cancel"
                onClick={onCancel}
              />
            </p>
          )
          : null }

        <PageFiller />
      </PageContents>
    </div>
  );
};

ConnectFormPage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  canCancel: PropTypes.bool.isRequired,
  sessionCodeIsValidating: PropTypes.bool.isRequired,
  sessionCodeIsValid: PropTypes.bool.isRequired,
};

const mapStateToProps = ({
  connectFormCanCancel,
  sessionCodeIsValidating,
  sessionCodeIsValid,
}) => ({
  canCancel: connectFormCanCancel,
  sessionCodeIsValid,
  sessionCodeIsValidating,
});

const mapDispatchToProps = (dispatch) => ({
  onSubmit: (sessionCode) => dispatch(connectFormOnSubmit(sessionCode)),
  onCancel: () => dispatch(connectFormOnCancel()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ConnectFormPage);
