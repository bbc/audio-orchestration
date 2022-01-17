/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  selectGetCurrentTime,
} from 'selectors';
import formatTime from './formatTime';

const PlayerProgressBar = ({
  canSeek,
  onSeek,
}) => {
  const speed = useSelector((state) => state.contentSpeed);
  const duration = useSelector((state) => state.contentDuration);
  const correlation = useSelector((state) => state.contentCorrelation);
  const getCurrentTime = useSelector(selectGetCurrentTime);

  const ref = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [containerOffsetX, setContainerOffsetX] = useState(0);

  // Calculate currentTime to include in accessibility labels (recalculated when component renders).
  const currentTime = getCurrentTime();

  // Helper to calculate the time corresponding to a pixel offset on the playbar
  const calculateDragPosition = (clientX) => {
    if (!ref.current) {
      return 0;
    }

    const offsetFraction = (clientX - containerOffsetX) / ref.current.clientWidth;
    return Math.max(0, Math.min(offsetFraction * duration, duration));
  };

  // Handler for the mousedown/touchstart event that starts a drag action.
  const handleStartDragging = (e) => {
    setContainerOffsetX(ref.current.getBoundingClientRect().left);
    setDragPosition(getCurrentTime());
    setIsDragging(true);
    e.preventDefault();
  };

  // Effect:
  // Update the play bar position on every frame while the media is playing.
  // Also reposition the playhead while it is being dragged.
  useEffect(() => {
    let updating = true;
    let frame = null;

    const update = () => {
      const progressBarTime = isDragging
        ? dragPosition
        : getCurrentTime();

      if (ref.current) {
        ref.current.style.paddingLeft = `${((progressBarTime) / duration) * 100}%`;
      }

      if (!isDragging && updating && speed !== 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      updating = false;
      window.cancelAnimationFrame(frame);
    };
  }, [
    ref,
    speed,
    getCurrentTime,
    isDragging,
    dragPosition,
  ]);

  // Effect:
  // Handle mouse movements while the playhead is being dragged.
  useEffect(() => {
    if (!isDragging || !ref.current) {
      return undefined;
    }

    const handleDragMove = (e) => {
      setDragPosition(calculateDragPosition(e.clientX));
    };

    const handleDragEnd = (e) => {
      setIsDragging(false);
      // seeking is relative to current time :(
      onSeek(calculateDragPosition(e.clientX) - getCurrentTime());
    };

    ref.current.addEventListener('pointermove', handleDragMove, false);
    ref.current.addEventListener('pointerup', handleDragEnd, false);
    ref.current.addEventListener('pointercancel', handleDragEnd, false);

    return () => {
      ref.current.removeEventListener('pointermove', handleDragMove);
      ref.current.removeEventListener('pointerup', handleDragEnd);
      ref.current.removeEventListener('pointercancel', handleDragEnd);
    };
  }, [
    ref,
    isDragging,
    setIsDragging,
    setDragPosition,
    calculateDragPosition,
    correlation,
    duration,
  ]);

  return (
    <div
      ref={ref}
      className={classnames(
        'player-controls-progress-bar',
        'accent-colour-background',
        { dragging: isDragging },
        { canSeek },
      )}
      onPointerDown={canSeek ? handleStartDragging : undefined}
      touch-action="none"
    >
      { canSeek
        ? (
          <div
            className={classnames(
              'player-controls-progress-bar-playhead',
              'accent-colour-background',
            )}
            onKeyDown={(e) => {
              if (['ArrowUp', 'ArrowRight'].includes(e.key)) {
                onSeek(Math.max(5, duration / 100));
                e.preventDefault();
              }
              if (['ArrowDown', 'ArrowLeft'].includes(e.key)) {
                onSeek(-Math.max(5, duration / 100));
                e.preventDefault();
              }
            }}
            tabIndex={0}
            aria-valuemin={formatTime(0)}
            aria-valuenow={formatTime(currentTime)}
            aria-valuemax={formatTime(duration)}
            role="slider"
          />
        )
        : null}
    </div>
  );
};

PlayerProgressBar.propTypes = {
  /* Whether the user can seek using the PlayerProgressBar */
  canSeek: PropTypes.bool,
  /* seek handler, taking as argument a relative offset from the current position */
  onSeek: PropTypes.func.isRequired,
};

PlayerProgressBar.defaultProps = {
  canSeek: false,
};

export default PlayerProgressBar;
