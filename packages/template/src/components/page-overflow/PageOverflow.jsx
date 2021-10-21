/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
