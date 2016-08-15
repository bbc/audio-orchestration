import React from 'react';
import { styles, joinStyles } from '../styles';

class CircleSlider extends React.Component {
  constructor(props) {
    super(props);

    // Bind event handlers so they can be added/remvoved without hacks.
    this.handleMouseMoveBound = this.handleMouseMove.bind(this);
    this.handleMouseDownBound = this.handleMouseDown.bind(this);
    this.handleMouseUpBound = this.handleMouseUp.bind(this);
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleMouseUpBound);
    document.removeEventListener('mousemove', this.handleMouseMoveBound);
  }

  getValueFromClickEvent(event) {
    const { minValue, maxValue } = this.props;
    const rect = this.refs.canvas.getBoundingClientRect();

    const clickX = (rect.left + rect.width / 2) - event.clientX;
    const clickY = (rect.top + rect.height / 2) - event.clientY;

    const clickRatio = (Math.atan2(clickX, clickY) + Math.PI) / (Math.PI * 2);
    const clickValue = clickRatio * (maxValue - minValue) + minValue;

    return Math.min(Math.max(clickValue, minValue), maxValue);
  }

  handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation();

    document.addEventListener('mouseup', this.handleMouseUpBound);
    document.addEventListener('mousemove', this.handleMouseMoveBound);
    this.updateCanvas(this.getValueFromClickEvent(event));
  }

  handleMouseUp(event) {
    event.preventDefault();
    event.stopPropagation();

    document.removeEventListener('mouseup', this.handleMouseUpBound);
    document.removeEventListener('mousemove', this.handleMouseMoveBound);
    const clickValue = this.getValueFromClickEvent(event);
    this.updateCanvas(clickValue);
    this.props.onChange(clickValue);
  }

  handleMouseMove(event) {
    event.preventDefault();
    event.stopPropagation();

    const clickValue = this.getValueFromClickEvent(event);
    this.updateCanvas(clickValue);
    this.props.onChange(clickValue);
  }

  updateCanvas(value = this.props.value) {
    const {
      bgColour,
      colour,
      size,
      stroke,
      wedge,
      minValue,
      maxValue,
    } = this.props;
    const context = this.refs.canvas.getContext('2d');
    const halfSize = size / 2;
    const outerRadius = halfSize;
    const innerRadius = Math.max(0, outerRadius - stroke);

    const valueRatio = (maxValue - value) / (maxValue - minValue);
    const valueStart = ((valueRatio * 360) - wedge + 90) / 360 * Math.PI * 2;
    const valueEnd = ((valueRatio * 360) + wedge + 90) / 360 * Math.PI * 2;

    // Clear the canvas.
    context.clearRect(0, 0, size, size);

    // Draw the torus background.
    context.beginPath();
    context.moveTo(halfSize, halfSize);
    context.arc(halfSize, halfSize, outerRadius, 0, Math.PI * 2, false);
    context.arc(halfSize, halfSize, innerRadius, Math.PI * 2, 0, true);
    context.fillStyle = bgColour;
    context.fill();

    // Draw the torus segment indicator.
    context.beginPath();
    context.moveTo(halfSize, halfSize);
    context.arc(halfSize, halfSize, outerRadius, valueStart, valueEnd, false);
    context.arc(halfSize, halfSize, innerRadius, valueEnd, valueStart, true);
    context.fillStyle = colour;
    context.fill();
  }

  render() {
    return (
      <div
        style={joinStyles(
          styles.flexboxColumn,
          styles.flexboxCenter,
          this.props.style
        )}
      >
        <canvas
          ref="canvas"
          width={this.props.size}
          height={this.props.size}
          onMouseDown={this.handleMouseDownBound}
        />
        <label>{this.props.label}</label>
        <label>{Math.round(this.props.value)}</label>
      </div>
    );
  }
}

CircleSlider.defaultProps = {
  bgColour: 'white',
  colour: 'black',
  size: 70,
  stroke: 25,
  wedge: 30,
  value: 0,
  minValue: 0,
  maxValue: 100,
  onChange: () => {},
};

CircleSlider.propTypes = {
  style: React.PropTypes.object,
  bgColour: React.PropTypes.string,
  colour: React.PropTypes.string,
  label: React.PropTypes.string,
  size: React.PropTypes.number,
  stroke: React.PropTypes.number,
  wedge: React.PropTypes.number,
  value: React.PropTypes.number,
  minValue: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  onChange: React.PropTypes.func,
};

export default CircleSlider;
