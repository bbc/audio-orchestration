import React from 'react';
import ObjectItem from './ObjectItem';
import DeviceItem from './DeviceItem';

class AllocationReplay extends React.Component {
  constructor(props) {
    super(props);

    this.currentStepRef = React.createRef();

    this.state = {
      currentStep: 0,
    };

    this.handleNextStep = this.handleNextStep.bind(this);
    this.handlePreviousStep = this.handlePreviousStep.bind(this);
    this.handleChangeStep = this.handleChangeStep.bind(this);
  }

  handleNextStep() {
    const { steps } = this.props;
    const { currentStep } = this.state;

    this.setState({ currentStep: Math.min(currentStep + 1, steps.length - 1) });
  }

  handlePreviousStep() {
    const { currentStep } = this.state;

    this.setState({ currentStep: Math.max(currentStep - 1, 0) });
  }

  handleChangeStep() {
    this.setState({ currentStep: this.currentStepRef.current.value });
  }

  render() {
    const {
      steps,
      objects,
      devices,
    } = this.props;

    const {
      currentStep,
    } = this.state;

    const step = steps[currentStep];

    if (!step) {
      return (
        <div className="allocation-replay">
          <h1>Nothing to display.</h1>
          <p>Something might have gone wrong, please reload the page and try again.</p>
        </div>
      );
    }

    return (
      <div className="allocation-replay">
        <div className="flex-row">
          <button onClick={this.handlePreviousStep} disabled={currentStep <= 0}>Previous</button>
          <input
            type="range"
            min="0"
            step="1"
            max={steps.length - 1}
            style={{ width: '100%' }}
            value={currentStep}
            onChange={this.handleChangeStep}
            ref={this.currentStepRef}
          />
          <button onClick={this.handleNextStep} disabled={currentStep >= (steps.length - 1)}>Next</button>
        </div>
        <h1>
          {'>> '}
          {step.name}
        </h1>
        <div className="flex-row">
          <div className="flex-column" style={{ width: '50%' }}>
            { objects.map((object) => (
              <ObjectItem
                object={object}
                active={object.objectId === step.activeObject}
                activeBehaviour={step.activeObjectBehaviour}
                key={object.objectId}
                objectState={step.objectState[object.objectId]}
              />
            ))}
          </div>
          <div className="flex-column" style={{ width: '50%' }}>
            { devices.map((device) => (
              <DeviceItem
                device={device}
                active={device.deviceId === step.activeDevice}
                deviceState={step.deviceState[device.deviceId]}
                key={device.deviceId}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

export default AllocationReplay;
