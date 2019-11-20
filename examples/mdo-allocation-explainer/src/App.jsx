import { hot } from 'react-hot-loader/root';
import React from 'react';
import DefaultAllocationAlgorithm from '@bbc/bbcat-orchestration/src/allocation-algorithm/DefaultAllocationAlgorithm';
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
      { behaviourType: 'mainOrAuxDevice' },
      { behaviourType: 'exclusive' },
      { behaviourType: 'cannotMove' },
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
      { behaviourType: 'spread', behaviourParameters: { perDeviceGainAdjust: 0.8 } },
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
              property: 'deviceTags.location',
              operator: 'anyOf',
              value: ['nearFront', 'farFront'],
            },
          ],
        },
      },
      // { behaviourType: 'prohibitedIf' },
      { behaviourType: 'moveToPreferredOnly' },
      { behaviourType: 'mainDeviceOnly' },
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
    deviceTags: [
      {
        tagId: 'foo',
        tagValues: ['Bar'],
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
    deviceTags: [
      {
        tagId: 'foo',
        tagValues: ['Bar'],
      },
    ],
  },
  {
    deviceId: 'd3',
    deviceIsMain: false,
    deviceJoiningNumber: 3,
    deviceCurrentNumber: 2,
    deviceCategory: 'mobile',
    deviceTags: [
      {
        tagId: 'location',
        tagValues: ['nearFront'],
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
