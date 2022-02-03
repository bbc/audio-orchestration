/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
// import classnames from 'classnames';
import { connect } from 'react-redux';
import Icon from 'components/icon/Icon';
import Button from 'components/button/Button';
import { addDismissedPrompt } from 'actions';

const OverlayPrompt = ({
  onClick,
  dismissed,
  onDismiss,
  iconComponent,
  header,
  content,
  children,
}) => {
  if (dismissed) {
    return null;
  }

  return (
    <div className="overlay-prompt">
      {iconComponent && (
        <div className="overlay-prompt-icon">
          <Button icon onClick={onClick}>{iconComponent}</Button>
        </div>
      )}
      <div className="overlay-prompt-content">
        {children && children}
        {!children && header && <h2>{header}</h2>}
        {!children && content && (
          <p>
            <button onClick={onClick} type="button">{content}</button>
          </p>
        )}
      </div>
      <div className="overlay-prompt-close">
        <Button icon title="Dismiss" onClick={onDismiss}>
          <Icon name="cross" size="small" />
        </Button>
      </div>
    </div>
  );
};

OverlayPrompt.propTypes = {
  onClick: PropTypes.func.isRequired,
  dismissed: PropTypes.bool.isRequired,
  onDismiss: PropTypes.func.isRequired,
  iconComponent: PropTypes.node,
  header: PropTypes.string,
  content: PropTypes.string,
  children: PropTypes.node,
};

OverlayPrompt.defaultProps = {
  iconComponent: undefined,
  header: undefined,
  content: undefined,
  children: undefined,
};

const mapStateToProps = ({
  dismissedPrompts,
}, ownProps) => ({
  dismissed: dismissedPrompts.includes(ownProps.promptId),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  onDismiss: () => dispatch(addDismissedPrompt(ownProps.promptId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(OverlayPrompt);
