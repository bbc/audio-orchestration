import React from 'react';
import PropTypes from 'prop-types';

class CounterControl extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    const {
      setValues,
      values,
      parameters,
    } = this.props;

    const { step } = parameters;

    setValues([(values[0] || 0) + step]);
  }

  render() {
    const {
      parameters,
    } = this.props;

    const {
      label,
    } = parameters;

    return (
      <button type="button" onClick={this.handleChange}>{label}</button>
    );
  }
}

CounterControl.propTypes = {
  parameters: PropTypes.shape({
    label: PropTypes.string.isRequired,
    step: PropTypes.number.isRequired,
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default CounterControl;
