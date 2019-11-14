import React from 'react';
import PropTypes from 'prop-types';

class CoordinateControl extends React.Component {
  constructor(props) {
    super(props);
    this.xRef = React.createRef();
    this.yRef = React.createRef();

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    const { setValues } = this.props;

    setValues([
      Number(this.xRef.current.value),
      Number(this.yRef.current.value),
    ]);
  }

  render() {
    const {
      parameters,
      values,
    } = this.props;

    const {
      xMin, xMax, xStep,
      yMin, yMax, yStep,
    } = parameters;

    return (
      <div>
        <input
          ref={this.xRef}
          type="range"
          min={xMin}
          max={xMax}
          step={xStep}
          onChange={this.handleChange}
          defaultValue={values[0] || 0}
        />
        <input
          ref={this.yRef}
          type="range"
          orient="vertical"
          min={yMin}
          max={yMax}
          step={yStep}
          onChange={this.handleChange}
          defaultValue={values[1] || 0}
        />
      </div>
    );
  }
}

CoordinateControl.propTypes = {
  parameters: PropTypes.shape({
    xMin: PropTypes.PropTypes.number.isRequired,
    xMax: PropTypes.PropTypes.number.isRequired,
    xStep: PropTypes.PropTypes.number.isRequired,
    yMin: PropTypes.PropTypes.number.isRequired,
    yMax: PropTypes.PropTypes.number.isRequired,
    yStep: PropTypes.PropTypes.number.isRequired,
  }).isRequired,
  setValues: PropTypes.func.isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
};

export default CoordinateControl;
