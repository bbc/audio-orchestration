import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const PageOverflow = ({
  children,
}) => (
  <div className={classnames('page-overflow')}>
    {children}
  </div>
);

PageOverflow.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageOverflow;
