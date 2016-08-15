import React from 'react';
import { styles, joinStyles } from '../styles';

class LinearSlider extends React.Component {
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
    const { height, minValue, maxValue } = this.props;
    const rect = this.refs.canvas.getBoundingClientRect();

    const clickRatio = (rect.bottom - event.clientY) / height;
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
      width,
      height,
      minValue,
      maxValue,
      defaultValue,
    } = this.props;
    const context = this.refs.canvas.getContext('2d');

    const defaultY = (maxValue - defaultValue) / (maxValue - minValue) * height;
    const valueY = (maxValue - value) / (maxValue - minValue) * height;
    const fillY = Math.min(defaultY, valueY);
    const fillHeight = Math.abs(defaultY - valueY);

    context.clearRect(0, 0, width, height);

    context.fillStyle = bgColour;
    context.fillRect(0, 0, width, height);

    context.fillStyle = colour;
    context.fillRect(0, fillY, width, fillHeight);
  }

  render() {
    const scaleFactor = Math.pow(10, this.props.dp);
    const value = Math.round(this.props.value * scaleFactor) / scaleFactor;

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
          width={this.props.width}
          height={this.props.height}
          onMouseDown={this.handleMouseDownBound}
        />
        <label>{this.props.label}</label>
        <label>{value}</label>
      </div>
    );
  }
}

LinearSlider.defaultProps = {
  bgColour: 'white',
  colour: 'black',
  width: 25,
  height: 70,
  value: 45,
  minValue: -90,
  maxValue: 90,
  defaultValue: 0,
  dp: 0,
  onChange: () => {},
};

LinearSlider.propTypes = {
  style: React.PropTypes.object,
  bgColour: React.PropTypes.string,
  colour: React.PropTypes.string,
  label: React.PropTypes.string,
  dp: React.PropTypes.number,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  value: React.PropTypes.number,
  minValue: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  defaultValue: React.PropTypes.number,
  onChange: React.PropTypes.func,
};

export default LinearSlider;
