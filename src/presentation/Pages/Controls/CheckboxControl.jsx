import React from 'react';
import PropTypes from 'prop-types';

class CheckboxControl extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { setValues, values } = this.props;
    const { name, checked } = e.target;

    if (!checked) {
      // unchecked, remove from current values
      setValues(values.filter(v => v !== name));
    } else {
      // checked, add to current values (but remove it first to so it's only in there once)
      setValues([...values.filter(v => v !== name), name]);
    }
  }

  render() {
    const {
      parameters,
      values,
    } = this.props;

    const { options } = parameters;

    return (
      <ul>
        { options.map(({ value, label }) => {
          const id = `checkbox_${value}_${label}`;
          return (
            <li key={id}>
              <label htmlFor={id}>
                <input
                  type="checkbox"
                  onChange={this.handleChange}
                  id={id}
                  name={value}
                  checked={values.includes(value)}
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

CheckboxControl.propTypes = {
  parameters: PropTypes.shape({
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })),
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CheckboxControl;
