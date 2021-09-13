import config from 'config';
import { createSelector } from 'reselect';
import getCurrentTimeImpl from 'components/player-controls/getCurrentTime';

// This selector returns a function to calculate the current position in the currently playing
// sequence; because the result of getCurrentTime depends on Date.now() it should not be memoized.
export const selectGetCurrentTime = createSelector(
  (state) => state.contentCorrelation,
  (state) => state.contentSpeed,
  (state) => state.contentDuration,
  (state) => state.loop,
  (
    correlation, speed, duration, loop,
  ) => () => getCurrentTimeImpl(correlation, speed, duration, loop),
);

export const selectIsNearEnd = createSelector(
  selectGetCurrentTime,
  (state) => state.contentDuration,
  (getCurrentTime, duration) => getCurrentTime() >= duration - 0.1,
);

export const selectEnableCalibration = () => !!config.CALIBRATION_SEQUENCE_URL;
