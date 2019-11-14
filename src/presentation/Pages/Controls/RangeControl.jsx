import React from 'react';
import PropTypes from 'prop-types';

class RangeControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    const { setValues } = this.props;

    setValues([Number(e.target.value)]);
  }

  render() {
    const {
      parameters,
      values,
    } = this.props;

    const {
      min,
      max,
      step,
    } = parameters;

    return (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        onChange={this.handleChange}
        defaultValue={values[0] || ''}
      />
    );
  }
}

RangeControl.propTypes = {
  parameters: PropTypes.shape({
    min: PropTypes.PropTypes.number.isRequired,
    max: PropTypes.PropTypes.number.isRequired,
    step: PropTypes.PropTypes.number.isRequired,
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default RangeControl;
