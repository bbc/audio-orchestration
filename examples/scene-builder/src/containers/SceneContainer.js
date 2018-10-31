import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { getSources } from '../reducer';
import { colours } from '../styles';
import Scene from '../components/Scene';

const SceneContainer = (props) => (
  <Scene bgColour={colours.controlBackground} {...props} />
);

SceneContainer.propTypes = {
  sources: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    url: PropTypes.string,
    description: PropTypes.string,
    azimuth: PropTypes.number,
    elevation: PropTypes.number,
    distance: PropTypes.number,
    gain: PropTypes.number,
  })).isRequired,
};

function mapStateToProps(state) {
  return {
    sources: getSources(state),
  };
}

export default connect(
  mapStateToProps
)(SceneContainer);
