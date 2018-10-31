import React from 'react';
import Graph from './Graph';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      programmeLoudnessValues: [],
      backgroundLoudnessValues: [],
      outputLoudnessValues: [],
      apacGain: 0,
      apacCompressionRatio: 0,
      apacCompressionThreshold: 0,
    };

    for (let i = 0; i < this.props.numberProgrammeLoudnessSamples; i++) {
      this.state.programmeLoudnessValues[i] = 0;
    }

    for (let i = 0; i < this.props.numberBackgroundLoudnessSamples; i++) {
      this.state.backgroundLoudnessValues[i] = 0;
    }

    for (let i = 0; i < this.props.numberOutputLoudnessSamples; i++) {
      this.state.outputLoudnessValues[i] = 0;
    }
  }

  componentDidMount() {
    this.interval = setInterval(() => { this.forceUpdate(); },
      Math.round(1 / this.props.sampleFrequency * 1000));
  }

  /* eslint-disable no-param-reassign */
  componentWillUpdate(nextProps, nextState) {
    nextState.programmeLoudnessValues.push(nextProps.getProgrammeLoudness());
    nextState.programmeLoudnessValues.shift();

    nextState.backgroundLoudnessValues.push(nextProps.getBackgroundLoudness());
    nextState.backgroundLoudnessValues.shift();

    nextState.outputLoudnessValues.push(nextProps.getOutputLoudness());
    nextState.outputLoudnessValues.shift();

    nextState.apacGain = nextProps.getApacGain();
    nextState.apacCompressionRatio = nextProps.getApacCompressionRatio();
    nextState.apacCompressionThreshold = nextProps.getApacCompressionThreshold();
  }
  /* eslint-enable no-param-reassign */

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div>
        <div className="statistics">
          <div className="statistic">
            <h2>Gain</h2>
            <p>{(this.state.apacGain).toFixed(2)}</p>
          </div>
          <div className="statistic">
            <h2>Compression Ratio</h2>
            <p>{(this.state.apacCompressionRatio).toFixed(2)}</p>
          </div>
          <div className="statistic">
            <h2>Compression Threshold</h2>
            <p>{(this.state.apacCompressionThreshold).toFixed(2)}</p>
          </div>
        </div>
        <Graph
          yAxisTitle={'SPL / dB'} title={'Background Loudness'}
          data={this.state.backgroundLoudnessValues}
          maxValue={100} graduations={[0, 20, 40, 60, 80, 100]}
          width={800} height={150} fill="#F4992A" bgFill="#f3f3ee"
        />
        <Graph
          yAxisTitle={'SPL / dB'} title={'Input Programme Loudness'}
          data={this.state.programmeLoudnessValues}
          maxValue={100} graduations={[0, 20, 40, 60, 80, 100]}
          width={800} height={150} fill="#264B59" bgFill="#f3f3ee"
        />
        <Graph
          yAxisTitle={'SPL / dB'} title={'Output Programme Loudness'}
          data={this.state.outputLoudnessValues}
          maxValue={100} graduations={[0, 20, 40, 60, 80, 100]}
          width={800} height={150} fill="#22988A" bgFill="#f3f3ee"
        />
      </div>
    );
  }
}

App.defaultProps = {
  sampleFrequency: 20,
  numberProgrammeLoudnessSamples: 400,
  numberBackgroundLoudnessSamples: 400,
  numberOutputLoudnessSamples: 400,
};

App.propTypes = {
  sampleFrequency: React.PropTypes.number,
  getApacGain: React.PropTypes.func.isRequired,
  getApacCompressionRatio: React.PropTypes.func.isRequired,
  getApacCompressionThreshold: React.PropTypes.func.isRequired,
  getProgrammeLoudness: React.PropTypes.func.isRequired,
  getBackgroundLoudness: React.PropTypes.func.isRequired,
  getOutputLoudness: React.PropTypes.func.isRequired,
  numberProgrammeLoudnessSamples: React.PropTypes.number,
  numberBackgroundLoudnessSamples: React.PropTypes.number,
  numberOutputLoudnessSamples: React.PropTypes.number,
};

export default App;
