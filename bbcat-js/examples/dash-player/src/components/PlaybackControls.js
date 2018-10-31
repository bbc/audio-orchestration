import React from 'react';

class PlaybackControls extends React.Component {
  getPlaybackString(current, duration) {
    const currentMins = Math.round(current / 60);
    const currentSecs = Math.round(current % 60);

    const durationMins = Math.round(duration / 60);
    const durationSecs = Math.round(duration % 60);

    return `${currentMins}:${currentSecs < 10 ? '0' : ''}${currentSecs} /
      ${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`;
  }

  render() {
    const {
      current,
      duration,
      isPlaying,
      handlePauseClick,
      handlePlayClick,
      handleSeekChange,
      handleSeekMouseUp,
    } = this.props;

    return (
      <div className="playback-controls">
        { isPlaying ?
          <button onClick={handlePauseClick}>&#10073;&#10073;</button> :
          <button onClick={handlePlayClick}>&#9658;</button>
        }

        <div>
          <input type="range"
            step={1} min={0} max={duration} value={current}
            onChange={handleSeekChange} onMouseUp={handleSeekMouseUp}
          />
        </div>

        <label>{this.getPlaybackString(current, duration)}</label>
      </div>
    );
  }
}

PlaybackControls.defaultProps = {
  current: 0,
  duration: 0,
  isPlaying: false,
  handlePauseClick: () => {},
  handlePlayClick: () => {},
  handleSeekChange: () => {},
  handleSeekMouseUp: () => {},
};

PlaybackControls.propTypes = {
  current: React.PropTypes.number,
  duration: React.PropTypes.number,
  isPlaying: React.PropTypes.bool,
  handlePauseClick: React.PropTypes.func,
  handlePlayClick: React.PropTypes.func,
  handleSeekChange: React.PropTypes.func,
  handleSeekMouseUp: React.PropTypes.func,
};

export default PlaybackControls;
