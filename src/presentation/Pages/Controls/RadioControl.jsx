import React from 'react';
import PropTypes from 'prop-types';

class RadioControl extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { setValues } = this.props;
    const { value, checked } = e.target;

    if (checked) {
      setValues([value]);
    }
  }

  render() {
    const {
      parameters,
      values,
    } = this.props;

    const currentValue = values[0];
    const { options } = parameters;

    return (
      <ul>
        { options.map(({ value, label }) => {
          const id = `radio_${value}_${label}`;
          return (
            <li key={id}>
              <label htmlFor={id}>
                <input
                  type="radio"
                  onChange={this.handleChange}
                  id={id}
                  value={value}
                  checked={value === currentValue}
                />
                {label}
              </label>
            </li>
          );
        })}
      </ul>
    );
  }
}

RadioControl.propTypes = {
  parameters: PropTypes.shape({
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })),
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RadioControl;
