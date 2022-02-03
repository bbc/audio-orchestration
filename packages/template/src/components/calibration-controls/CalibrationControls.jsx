/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
  requestCalibrationSetPlaybackOffset,
} from 'actions';

import Input from 'components/input/Input';
import Button from 'components/button/Button';

const CalibrationControls = ({
  onChange,
}) => {
  const min = -500;
  const max = 500;
  const step = 1;

  const devicePlaybackOffset = useSelector((state) => state.devicePlaybackOffset);

  const [playbackOffset, setPlaybackOffset] = useState(devicePlaybackOffset);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(requestCalibrationSetPlaybackOffset(playbackOffset));
    onChange(playbackOffset);
  }, [playbackOffset]);

  const addStep = () => {
    setPlaybackOffset(Math.min(max, Math.max(min, playbackOffset + step)));
  };

  const takeStep = () => {
    setPlaybackOffset(Math.min(max, Math.max(min, playbackOffset - step)));
  };

  return (
    <>
      <p>
        A test sound will be played from both devices simultaneously.
        Move the slider until the sound coming from the two devices is in time
        (or as close as possible).
      </p>
      <Input
        min={min}
        max={max}
        step={step}
        value={playbackOffset}
        type="range"
        onChange={(e) => setPlaybackOffset(Number(e.target.value))}
        className="slider"
      />
      <div className="control-buttons">
        <Button content={`−${step} ms`} onClick={takeStep} />
        <p className="value-display">{`${(playbackOffset < 0) ? '−' : '+'}${Math.abs(playbackOffset)} ms`}</p>
        <Button content={`+${step} ms`} onClick={addStep} />
      </div>
    </>
  );
};

CalibrationControls.propTypes = {
  onChange: PropTypes.func.isRequired,
};

export default CalibrationControls;
