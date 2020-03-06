import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const PageContents = ({
  children,
}) => (
  <div className={classnames('page-contents')}>
    {children}
  </div>
);

PageContents.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContents;
