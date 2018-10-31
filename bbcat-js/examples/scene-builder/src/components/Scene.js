import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import React3 from 'react-Three-renderer';
import Three from 'three';
import threeOrbitControls from 'three-orbit-controls';
import { styles, joinStyles, getChannelColour } from '../styles';

class Scene extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.cameraPosition = new Three.Vector3(0, 0, 20);
    this._onAnimate = () => { };
  }

  componentDidMount() {
    const OrbitControls = threeOrbitControls(Three);
    this.controls = new OrbitControls(
      this.refs.mainCamera,
      ReactDOM.findDOMNode(this.refs.react3));
  }

  convertToThreePosition(az, el, d) {
    const azRadians = az * Math.PI / 180;
    const elRadians = el * Math.PI / 180;

    const x = d * -Math.sin(azRadians) * Math.cos(elRadians);
    const y = d * Math.cos(azRadians) * Math.cos(elRadians);
    const z = d * Math.sin(elRadians);

    return new Three.Vector3(x, y, z);
  }

  render() {
    const { width, height, title, sources, style } = this.props;

    return (
      <div style={joinStyles(styles.flexboxColumn, style)}>
        <h1 style={joinStyles(styles.title, styles.flexboxItemFirst)}>
          {title}
        </h1>
        <div style={styles.flexboxColumnItem}>
          <React3
            ref="react3" mainCamera="camera" width={width} height={height}
            clearColor={this.props.bgColour} onAnimate={this._onAnimate}
          >
            <scene>
              <perspectiveCamera ref="mainCamera" name="camera" fov={75} near={0.1}
                far={1000} aspect={width / height} position={this.cameraPosition}
              />
              <axisHelper size={5} />
              { sources.map((source, i) => {
                const position = this.convertToThreePosition(
                  source.azimuth, source.elevation, source.distance * 10);

                return source.gain ? (
                  <mesh key={source.id} position={position}>
                    <meshBasicMaterial color={getChannelColour(i)} />
                    <sphereGeometry
                      radius={source.gain}
                      widthSegments={16}
                      heightSegments={16}
                    />
                  </mesh>
                ) : null;
              })}
            </scene>
          </React3>
        </div>
      </div>
    );
  }
}

Scene.defaultProps = {
  width: 500,
  height: 500,
  title: 'Scene',
};

Scene.propTypes = {
  style: React.PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  title: PropTypes.string,
  className: PropTypes.string,
  bgColour: React.PropTypes.string,
  sources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    url: PropTypes.string,
    description: PropTypes.string,
    gain: PropTypes.number,
  })).isRequired,
};

export default Scene;
