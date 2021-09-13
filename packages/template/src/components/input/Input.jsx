import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Input = React.forwardRef(({
  className,
  placeholder,
  type,
  maxLength,
  disabled,
  onKeyPress,
  onChange,
  onFocus,
  value,
  fluid,
  error,
  checked,
  min,
  max,
  step,
  readOnly,
}, ref) => (
  <input
    className={classnames(
      'input',
      { disabled },
      { fluid },
      { error },
      type,
      className,
    )}
    autoComplete="off"
    placeholder={placeholder}
    type={type}
    maxLength={maxLength}
    ref={ref}
    disabled={disabled}
    onKeyPress={onKeyPress}
    onChange={onChange}
    onFocus={onFocus}
    value={value}
    checked={checked}
    min={min}
    max={max}
    step={step}
    readOnly={readOnly}
  />
));

Input.propTypes = {
  /* extra classes to apply to the input element */
  className: PropTypes.string,
  /* whether the input is disabled */
  disabled: PropTypes.bool,
  /* placeholder text to show when value is empty */
  placeholder: PropTypes.string,
  /* type of input to use, e.g. text, number, tel, email, ... */
  type: PropTypes.string,
  /* maximum number of characters accepted */
  maxLength: PropTypes.number,
  /* onKeyPress handler for the input element */
  onKeyPress: PropTypes.func,
  /* onChange handler for the input element */
  onChange: PropTypes.func,
  /* onFocus handler for the input element */
  onFocus: PropTypes.func,
  /* current value of the input element; for controlled components */
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  /* whether the input should be fluid (takes up the width of its container) */
  fluid: PropTypes.bool,
  /* whether the input should be marked as being in error */
  error: PropTypes.bool,
  /* whether the input (if it is a radio or checkbox) is currently checked */
  checked: PropTypes.bool,
  /* minimum value for a range control */
  min: PropTypes.number,
  /* maximum value for a range control */
  max: PropTypes.number,
  /* step size for a range control */
  step: PropTypes.number,
  /* whether the input is readonly */
  readOnly: PropTypes.bool,
};

Input.defaultProps = {
  className: undefined,
  disabled: false,
  placeholder: undefined,
  type: 'text',
  maxLength: undefined,
  onKeyPress: undefined,
  onChange: undefined,
  onFocus: undefined,
  value: undefined,
  fluid: false,
  error: false,
  checked: false,
  min: undefined,
  max: undefined,
  step: undefined,
  readOnly: false,
};

export default Input;
