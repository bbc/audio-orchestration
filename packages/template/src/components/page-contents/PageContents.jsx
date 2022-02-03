/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Footer from 'components/footer/Footer';
import config from 'config';

const PageContents = ({
  children,
}) => (
  <div className={classnames('page-contents')}>
    {children}
    {config.SHOW_BBC_FOOTER && <Footer />}
  </div>
);

PageContents.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContents;
