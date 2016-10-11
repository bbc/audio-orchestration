import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import React3 from 'react-three-renderer';
import Three from 'three';
import threeOrbitControls from 'three-orbit-controls';

class AudioScene extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.cameraPosition = new Three.Vector3(0, 0, 20);
    this.onAnimate = this.onAnimate.bind(this);
    this.channels = [];
  }

  componentDidMount() {
    const OrbitControls = threeOrbitControls(Three);
    this.controls = new OrbitControls(
      this.refs.mainCamera,
      ReactDOM.findDOMNode(this.refs.react3));
  }

  onAnimate() {
    this.channels = this.props.getChannels();
  }

  render() {
    const { width, height, channelColours } = this.props;

    return (
      <React3 ref="react3" mainCamera="camera" onAnimate={this.onAnimate}
        width={width} height={height} clearColor={this.props.bgColour}
      >
        <scene>
          <perspectiveCamera ref="mainCamera" name="camera" aspect={width / height}
            fov={75} near={0.1} far={1000} position={this.cameraPosition}
          />
          <axisHelper size={10} />
          { this.channels.map((channel, i) => {
            const { x, y, z } = channel.position;
            const position = new Three.Vector3(x, y, z);
            const colour = channelColours[i % channelColours.length];

            return channel.gain ? (
              <mesh key={i} position={position}>
                <meshBasicMaterial color={colour} />
                <sphereGeometry
                  radius={channel.gain / 2}
                  widthSegments={16}
                  heightSegments={16}
                />
              </mesh>
            ) : null;
          })}
        </scene>
      </React3>
    );
  }
}

AudioScene.defaultProps = {
  width: 800,
  height: 500,
  bgColour: '#F3F3EE',
  channelColours: [
    '#22988A',
    '#212449',
    '#C7DAE7',
    '#F4992A',
    '#264B59',
    '#1C1C1B',
  ],
  getChannels: () => [],
};

AudioScene.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  bgColour: React.PropTypes.string,
  channels: React.PropTypes.array,
  channelColours: React.PropTypes.array,
  getChannels: React.PropTypes.func,
};

export default AudioScene;
