import React from 'react';
import TrackSelect from './TrackSelect';
import AudioScene from './AudioScene';
import PlaybackControls from './PlaybackControls';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isPlaying: false,
      seek: 0,
      current: 0,
      duration: 0,
    };

    this.handlePauseClick = this.handlePauseClick.bind(this);
    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handleSeekChange = this.handleSeekChange.bind(this);
    this.handleSeekMouseUp = this.handleSeekMouseUp.bind(this);
    this.handleRenderTypeChanged = this.handleRenderTypeChanged.bind(this);
    this.handleManifestUrlChanged = this.handleManifestUrlChanged.bind(this);
    this.getChannels = this.getChannels.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => { this.forceUpdate(); }, 200);
  }

  /* eslint-disable no-param-reassign */
  componentWillUpdate(nextProps, nextState) {
    nextState.current = nextProps.dashAudio.current;
    nextState.duration = nextProps.dashAudio.duration;
    nextState.isPlaying = nextProps.dashAudio.state === 'playing' ||
      nextProps.dashAudio.state === 'priming';
  }
  /* eslint-enable no-param-reassign */

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getChannels() {
    return this.props.dashAudio.channelConfigurations;
  }

  handleRenderTypeChanged(e) {
    this.props.dashAudio.pause();
    this.props.dashAudio.renderType =
      this.props.renderTypes[e.nativeEvent.target.value];
    this.setState({ seek: 0 });
  }

  handleManifestUrlChanged(e) {
    this.props.dashAudio.pause();
    this.props.dashAudio.manifestUrl = e.nativeEvent.target.value;
    this.setState({ seek: 0 });
  }

  handlePauseClick() {
    this.setState({ seek: this.props.dashAudio.current });
    this.props.dashAudio.pause();
  }

  handlePlayClick() {
    this.startPlayback(this.state.seek || 0);
  }

  handleSeekChange(e) {
    this.setState({ seek: e.nativeEvent.target.value });
  }

  handleSeekMouseUp(e) {
    const seek = parseInt(e.nativeEvent.target.value, 10);
    this.setState({ seek });

    if (this.state.isPlaying) {
      this.startPlayback(seek);
    }
  }

  startPlayback(seek) {
    this.props.dashAudio.pause();
    this.props.dashAudio.play(seek)
      .then(() => {
        if (seek !== this.state.seek) {
          this.startPlayback(this.state.seek);
        } else {
          this.setState({ seek: 0 });
        }
      });
  }

  render() {
    const {
      seek,
      current,
      duration,
      isPlaying,
    } = this.state;

    const {
      assetsList,
      renderTypes,
    } = this.props;

    return (
      <div>
        <TrackSelect
          handleRenderTypeChanged={this.handleRenderTypeChanged}
          handleManifestUrlChanged={this.handleManifestUrlChanged}
          assetsList={assetsList}
          renderTypes={renderTypes}
        />
        <AudioScene
          getChannels={this.getChannels}
        />
        <PlaybackControls
          current={seek || current}
          duration={duration}
          isPlaying={isPlaying}
          handlePauseClick={this.handlePauseClick}
          handlePlayClick={this.handlePlayClick}
          handleSeekChange={this.handleSeekChange.assets}
          handleSeekMouseUp={this.handleSeekMouseUp}
        />
      </div>
    );
  }
}

App.propTypes = {
  dashAudio: React.PropTypes.object.isRequired,
  renderTypes: React.PropTypes.array.isRequired,
  assetsList: React.PropTypes.array.isRequired,
};

export default App;
