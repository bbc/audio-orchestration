import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PageFiller from 'components/page-filler/PageFiller';
import PageContents from 'components/page-contents/PageContents';
import Icon from 'components/icon/Icon';
import Button from 'components/button/Button';
import { errorOnRetry } from 'actions';

const ErrorPage = ({
  errorMessage,
  errorShowRetry,
  onRetry,
}) => (
  <div className={classnames('page', 'page-error')}>
    <PageContents>
      <PageFiller />
      <p style={{ textAlign: 'center' }}>
        <Icon name="cross" size="large" />
      </p>
      <p style={{ textAlign: 'center' }}>
        { errorMessage || 'Sorry; there was an error.' }
      </p>
      { errorShowRetry && (
        <p style={{ textAlign: 'center' }}>
          <Button content="Try again" onClick={onRetry} />
        </p>
      )}
      <PageFiller />
    </PageContents>
  </div>
);

ErrorPage.propTypes = {
  errorMessage: PropTypes.string,
  errorShowRetry: PropTypes.bool,
  onRetry: PropTypes.func.isRequired,
};

ErrorPage.defaultProps = {
  errorMessage: undefined,
  errorShowRetry: false,
};

const mapStateToProps = ({
  errorMessage,
  errorShowRetry,
}) => ({
  errorMessage,
  errorShowRetry,
});

const mapDispatchToProps = (dispatch) => ({
  onRetry: () => dispatch(errorOnRetry()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ErrorPage);
