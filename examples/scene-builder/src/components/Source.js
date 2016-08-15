import React, { PropTypes } from 'react';
import LinearSlider from './LinearSlider';
import CircleSlider from './CircleSlider';
import { styles, joinStyles } from '../styles';

class Source extends React.Component {
  render() {
    const {
      colour,
      bgColour,
      style,
      description,
      url,
      azimuth,
      elevation,
      gain,
      distance,
      onAzimuthChanged,
      onElevationChanged,
      onGainChanged,
      onDistanceChanged,
      onUrlChanged,
      onDescriptionChanged,
      onRemoveSource,
    } = this.props;

    return (
      <div ref="audio-source" style={joinStyles(styles.flexbox, style)}>
        <div style={joinStyles(styles.flexboxColumn, styles.flexboxFirstItem)}>
          <input
            style={joinStyles(styles.button, styles.flexboxFirstItem)}
            placeholder={'Source Description'} value={description}
            onChange={onDescriptionChanged}
          />
          <input
            style={joinStyles(styles.button, styles.flexboxColumnItem)}
            placeholder={'Source URL'} value={url}
            onChange={onUrlChanged}
          />
          <button
            style={joinStyles(styles.button, styles.flexboxColumnItem, { width: '20px' })}
            onClick={onRemoveSource}
          >
            -
          </button>
        </div>

        <div style={joinStyles(styles.flexbox, styles.flexboxItem)}>
          <CircleSlider
            style={styles.flexboxItem} colour={colour} bgColour={bgColour}
            label="Az." dp={1} minValue={-180} maxValue={180} value={azimuth}
            onChange={onAzimuthChanged}
          />
          <LinearSlider
            style={styles.flexboxItem} colour={colour} bgColour={bgColour}
            label="El." dp={1} minValue={-90} maxValue={90} value={elevation}
            onChange={onElevationChanged}
          />
          <LinearSlider
            style={styles.flexboxItem} colour={colour} bgColour={bgColour}
            label="Dis." dp={1} minValue={0.01} maxValue={1} value={distance}
            onChange={onDistanceChanged}
          />
          <LinearSlider
            style={styles.flexboxItem} colour={colour} bgColour={bgColour}
            label="Gn." dp={2} minValue={0} maxValue={1} value={gain}
            onChange={onGainChanged}
          />
        </div>
      </div>
    );
  }
}

Source.defaultProps = {
  description: '',
  url: '',
  azimuth: 0,
  elevation: 0,
  distance: 0.01,
  gain: 1,
  onAzimuthChanged: () => {},
  onElevationChanged: () => {},
  onDistanceChanged: () => {},
  onGainChanged: () => {},
  onUrlChanged: () => {},
  onDescriptionChanged: () => {},
  onRemoveSource: () => {},
};

Source.propTypes = {
  colour: React.PropTypes.string,
  bgColour: React.PropTypes.string,
  style: React.PropTypes.object,
  description: PropTypes.string,
  url: PropTypes.string,
  azimuth: PropTypes.number,
  elevation: PropTypes.number,
  distance: PropTypes.number,
  gain: PropTypes.number,
  onAzimuthChanged: PropTypes.func,
  onElevationChanged: PropTypes.func,
  onDistanceChanged: PropTypes.func,
  onGainChanged: PropTypes.func,
  onUrlChanged: PropTypes.func,
  onDescriptionChanged: PropTypes.func,
  onRemoveSource: PropTypes.func,
};

export default Source;
