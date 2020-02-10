import React from 'react';
import PropTypes from 'prop-types';
import config from '../../../config';
import LargeButton from '../../Components/LargeButton';
import RadioControl from './RadioControl';
import CheckboxControl from './CheckboxControl';
import RangeControl from './RangeControl';
import CoordinateControl from './CoordinateControl';
import TextControl from './TextControl';
import CounterControl from './CounterControl';

const getControlComponent = (controlType) => {
  switch (controlType) {
    case 'radio':
      return RadioControl;
    case 'checkbox':
      return CheckboxControl;
    case 'range':
      return RangeControl;
    case 'coordinate':
      return CoordinateControl;
    case 'text':
      return TextControl;
    case 'counter':
      return CounterControl;
    default:
      console.warn(`unknown controlType ${controlType}`);
      return TextControl;
  }
};

const ControlsPage = ({
  controlsOnClose,
  setControlValues = () => {},
  controlValues = {},
  activeControlIds,
}) => {
  const makeSetValues = (controlId) => (values) => setControlValues({ [controlId]: values });

  return (
    <div className="page page-controls">
      <h1>
        Controls
      </h1>

      { config.CONTROLS.filter(({ controlId }) => activeControlIds.includes(controlId)).map(({
        controlId,
        controlType,
        controlName,
        controlParameters,
      }) => {
        const ControlComponent = getControlComponent(controlType);
        const currentValues = controlValues[controlId] || [];
        return (
          <div key={controlId} className="control">
            <h2>{controlName}</h2>
            { config.DEBUG_UI ? (
              <p>
                {controlId}
                {' - '}
                <em>{controlType}</em>
                {' - '}
                <em>{JSON.stringify(currentValues)}</em>
              </p>
            ) : null }
            <ControlComponent
              parameters={controlParameters}
              setValues={makeSetValues(controlId)}
              values={currentValues}
            />
          </div>
        );
      })}

      <p>
        <LargeButton
          text="Close"
          secondaryText="Return to the player."
          onClick={() => controlsOnClose()}
        />
      </p>
    </div>
  );
};

ControlsPage.propTypes = {
  controlsOnClose: PropTypes.func.isRequired,
  setControlValues: PropTypes.func.isRequired,
  controlValues: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]))).isRequired,
  activeControlIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ControlsPage;
