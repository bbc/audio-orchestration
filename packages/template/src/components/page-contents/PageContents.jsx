import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Footer from 'components/footer/Footer';

const PageContents = ({
  children,
}) => (
  <div className={classnames('page-contents')}>
    {children}
    <Footer />
  </div>
);

PageContents.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageContents;
