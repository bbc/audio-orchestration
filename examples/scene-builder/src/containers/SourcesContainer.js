import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { getSources, getChannelHandler } from '../reducer';
import * as actions from '../actions';
import Source from '../components/Source';
import SourcesList from '../components/SourcesList';
import { styles, colours, getChannelColour } from '../styles';
import { saveToLocalStorage, loadFromLocalStorage } from '../serialisation';

const SourcesContainer = (props) => (
  /* eslint-disable react/jsx-no-bind */
  <SourcesList
    style={props.style} {...props}
    onChannelHandlerChanged={(e) => {
      props.onChannelHandlerChanged(e.nativeEvent.target.value);
    }}
    onAddSource={() => {
      const nextId = props.sources.reduce(
        (id, source) => Math.max(id, source.id + 1), 0);
      props.onAddSource({
        id: nextId,
        azimuth: 0,
        elevation: 0,
        distance: 0.01,
        gain: 1,
      });
    }}
  >
    { props.sources.map((source, i) =>
      <Source {...source} key={source.id}
        colour={getChannelColour(i)} bgColour={colours.controlBackground}
        style={(i === 0) ? styles.flexboxItemFirst : styles.flexboxColumnItem}
        onRemoveSource={() => {
          props.onRemoveSource(source.id);
        }}
        onAzimuthChanged={(azimuth) => {
          props.onAzimuthChanged(source.id, azimuth);
        }}
        onElevationChanged={(elevation) => {
          props.onElevationChanged(source.id, elevation);
        }}
        onDistanceChanged={(distance) => {
          props.onDistanceChanged(source.id, distance);
        }}
        onGainChanged={(gain) => {
          props.onGainChanged(source.id, gain);
        }}
        onUrlChanged={(e) => {
          props.onSourceUrlChanged(source.id, e.nativeEvent.target.value);
        }}
        onDescriptionChanged={(e) => {
          props.onSourceDescriptionChanged(source.id, e.nativeEvent.target.value);
        }}
      />
    )}
  </SourcesList>
  /* eslint-enable react/jsx-no-bind */
);

SourcesContainer.propTypes = {
  style: PropTypes.object,
  sources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    colour: PropTypes.string,
    url: PropTypes.string,
    description: PropTypes.string,
    azimuth: PropTypes.number,
    elevation: PropTypes.number,
    distance: PropTypes.number,
    gain: PropTypes.number,
  })).isRequired,
  channelHander: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onAddSource: PropTypes.func.isRequired,
  onChannelHandlerChanged: PropTypes.func.isRequired,
  onRemoveSource: PropTypes.func.isRequired,
  onSourceUrlChanged: PropTypes.func.isRequired,
  onSourceDescriptionChanged: PropTypes.func.isRequired,
  onAzimuthChanged: PropTypes.func.isRequired,
  onElevationChanged: PropTypes.func.isRequired,
  onDistanceChanged: PropTypes.func.isRequired,
  onGainChanged: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    sources: getSources(state),
    channelHandler: getChannelHandler(state),
    onSave: () => { saveToLocalStorage(state); },
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad: () => {
      dispatch(actions.setState(loadFromLocalStorage()));
    },
    onAddSource: (source) => {
      dispatch(actions.addSource(source));
    },
    onChannelHandlerChanged: (channelHandler) => {
      dispatch(actions.setChannelHandler(channelHandler));
    },
    onRemoveSource: (sourceId) => {
      dispatch(actions.removeSource(sourceId));
    },
    onSourceUrlChanged: (sourceId, url) => {
      dispatch(actions.setSourceUrl(sourceId, url));
    },
    onSourceDescriptionChanged: (sourceId, description) => {
      dispatch(actions.setSourceDescription(sourceId, description));
    },
    onAzimuthChanged: (sourceId, azimuth) => {
      dispatch(actions.setSourceAzimuth(sourceId, azimuth));
    },
    onElevationChanged: (sourceId, elevation) => {
      dispatch(actions.setSourceElevation(sourceId, elevation));
    },
    onDistanceChanged: (sourceId, distance) => {
      dispatch(actions.setSourceDistance(sourceId, distance));
    },
    onGainChanged: (sourceId, gain) => {
      dispatch(actions.setSourceGain(sourceId, gain));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SourcesContainer);
