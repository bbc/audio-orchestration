/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const LightingEffect = ({
  name,
  color,
  period,
  repeat,
}) => {
  const style = {
    animationDuration: `${period}s`,
    animationIterationCount: repeat,
    '--effect-color': color,
  };

  return (
    <div
      className={classnames('lighting-effect', `lighting-effect-${name}`)}
      style={style}
    />
  );
};

LightingEffect.propTypes = {
  name: PropTypes.oneOf([
    'static',
    'breathe',
    'heartbeat',
    'sine',
  ]).isRequired,
  color: PropTypes.string.isRequired,
  period: PropTypes.number,
  repeat: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
};

LightingEffect.defaultProps = {
  period: 3,
  repeat: 'infinite',
};

export default LightingEffect;
