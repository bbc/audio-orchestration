/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import CheckboxControl from './CheckboxControl';
import RadioControl from './RadioControl';
import RangeControl from './RangeControl';
import CounterControl from './CounterControl';
// import TextControl from './TextControl';
// import CoordinateControl from './TextControl';

const getControlComponent = (controlType) => {
  switch (controlType) {
    case 'checkbox':
      return CheckboxControl;
    case 'radio':
      return RadioControl;
    case 'range':
      return RangeControl;
    case 'counter':
      return CounterControl;
    // case 'text':
    //   return TextControl;
    // case 'coordinate':
    //   return CoordinateControl;
    default:
      return () => (<p>{`Unknown control type ${controlType}!`}</p>);
  }
};

const Controls = ({
  controls,
  onChangeControl,
}) => (
  <div
    className={classnames(
      'controls',
    )}
  >
    {controls.map(({
      controlId,
      controlName,
      controlType,
      controlParameters,
      currentValues,
    }) => {
      const ControlComponent = getControlComponent(controlType);
      return (
        <div className="controls-control" key={controlId}>
          <h2>{controlName}</h2>
          <ControlComponent
            parameters={controlParameters}
            currentValues={currentValues}
            onChangeControl={(values) => onChangeControl(controlId, values)}
          />
        </div>
      );
    })}
  </div>
);

Controls.propTypes = {
  controls: PropTypes.arrayOf(PropTypes.shape({
    controlId: PropTypes.string.isRequired,
    controlName: PropTypes.string.isRequired,
    controlType: PropTypes.string.isRequired,
    controlParameters: PropTypes.shape({}),
    currentValues: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ])).isRequired,
  })).isRequired,
  onChangeControl: PropTypes.func.isRequired,
};

export default Controls;
