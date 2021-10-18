import { hot } from 'react-hot-loader/root';
import React from 'react';
import { DefaultAllocationAlgorithm } from '@bbc/audio-orchestration-core';
import MetadataEntry from './MetadataEntry';
import AllocationReplay from './AllocationReplay';

const allocationAlgorithm = new DefaultAllocationAlgorithm({ saveSteps: true });

const mockObjects = [
  {
    objectId: 'o1',
    objectName: 'Object 1',
    objectLabels: [],
    objectPriority: 1,
    objectPan: 0.0,
    objectGain: 1.0,
    objectImage: null,
    objectBehaviours: [
      { behaviourType: 'exclusive' },
      { behaviourType: 'allowedEverywhere' },
    ],
  },
  {
    objectId: 'o2',
    objectName: 'Object 2',
    objectLabels: [],
    objectPriority: 2,
    objectPan: 0.0,
    objectGain: 1.0,
    objectImage: null,
    objectBehaviours: [
      { behaviourType: 'auxDevicesOnly' },
      { behaviourType: 'spread', behaviourParameters: { perDeviceGainAdjust: -3 } },
      { behaviourType: 'allowedEverywhere' },
      {
        behaviourType: 'onChange',
        behaviourParameters: {
          start: 'canAlwaysStart',
          allocate: ['moveToPreferred', 'stayInPrevious', 'moveToAllowedNotPrevious', 'moveToAllowed'],
        },
      },
    ],
  },
  {
    objectId: 'o3',
    objectName: 'Object 3',
    objectLabels: [],
    objectPriority: 3,
    objectPan: 0.0,
    objectGain: 1.0,
    objectImage: null,
    objectBehaviours: [
      // { behaviourType: 'preferredIf' },
      {
        behaviourType: 'allowedIf',
        behaviourParameters: {
          conditions: [
            {
              property: 'deviceControls.location',
              operator: 'anyOf',
              value: ['nearFront', 'farFront'],
            },
          ],
        },
      },
    ],
  },
];

const mockDevices = [
  {
    deviceId: 'd1',
    deviceIsMain: true,
    deviceJoiningNumber: 1,
    deviceCurrentNumber: 1,
    deviceCategory: 'desktop',
    deviceGain: 1.0,
    deviceLatency: null,
    deviceControls: [
      {
        controlId: 'location',
        controlValues: ['nearFront'],
      },
    ],
  },
  {
    deviceId: 'd2',
    deviceIsMain: false,
    deviceJoiningNumber: 2,
    deviceCurrentNumber: 2,
    deviceCategory: 'mobile',
    deviceGain: 1.0,
    deviceLatency: 19,
    deviceControls: [
      {
        controlId: 'location',
        controlValues: ['farRear'],
      },
    ],
  },
  {
    deviceId: 'd3',
    deviceIsMain: false,
    deviceJoiningNumber: 3,
    deviceCurrentNumber: 2,
    deviceCategory: 'mobile',
    deviceControls: [
      {
        controlId: 'location',
        controlValues: ['farFront'],
      },
    ],
  },
];

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previousResults: {},
      devices: mockDevices,
      objects: mockObjects,
      steps: [],
    };

    this.handleReallocate = this.handleReallocate.bind(this);
    this.handleClearState = this.handleClearState.bind(this);
  }

  handleReallocate({ objects, devices }) {
    const { previousResults } = this.state;
    const results = allocationAlgorithm.allocate({
      objects,
      devices,
      previousResults,
    });

    const { steps } = results;

    this.setState({
      previousResults: results,
      steps,
      objects,
      devices,
    });
  }

  handleClearState() {
    this.setState({
      previousResults: null,
      steps: [],
    });
    const { objects, devices } = this.state;
    this.handleReallocate({ objects, devices });
  }

  render() {
    const {
      devices,
      objects,
      steps,
    } = this.state;

    return (
      <div className="app">
        <MetadataEntry objects={objects} devices={devices} onReallocate={this.handleReallocate} onClearState={this.handleClearState} />
        <AllocationReplay objects={objects} devices={devices} steps={steps} />
      </div>
    );
  }
}

export default hot(App);
