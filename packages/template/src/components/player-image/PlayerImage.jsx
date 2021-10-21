/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import LightingEffect from 'components/lighting-effect/LightingEffect';

const PlayerImage = ({
  image,
  effect,
  className,
  children,
}) => (
  <div
    className={classnames(
      'player-image',
      className,
    )}
  >
    <div className={classnames('player-image-aspect')}>
      <div className={classnames('player-image-aspect-inner')}>
        <ReactCSSTransitionReplace
          transitionName="cross-fade"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={1000}
        >
          <div key={`${image.src}-${effect && effect.name}-${effect && effect.color}`}>
            <img src="images/vignette.png" className="player-image-vignette" alt="" />
            {effect && (
              <LightingEffect
                name={effect.name}
                color={effect.color}
                period={effect.period}
                repeat={effect.repeat}
              />
            )}
            {image && (
              <img
                src={image.src}
                alt={image.alt}
                className={classnames('player-image-image')}
                width="600"
                height="600"
              />
            )}
            {!image && !effect && <div className={classnames('player-image-placeholder')} />}
          </div>
        </ReactCSSTransitionReplace>
      </div>
    </div>
    { children }
  </div>
);

PlayerImage.propTypes = {
  image: PropTypes.shape({
    src: PropTypes.string,
    alt: PropTypes.string,
  }),
  effect: PropTypes.shape({
    name: PropTypes.string,
    color: PropTypes.string,
    period: PropTypes.number,
    repeat: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  }),
  /* Any additional class names to use on the container div */
  className: PropTypes.string,
  /* Optional child elements to render within the player image container - overlay with CSS */
  children: PropTypes.node,
};

PlayerImage.defaultProps = {
  image: undefined,
  effect: undefined,
  className: undefined,
  children: null,
};

export default PlayerImage;
