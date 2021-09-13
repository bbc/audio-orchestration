import React from 'react';
import PropTypes from 'prop-types';
import GelIcon from 'components/gel-icon/GelIcon';

const Guidance = ({
  content,
}) => (
  <p className="guidance">
    <GelIcon name="parental-guidance" className="guidance-icon" size="small" />
    <span className="guidance-content">{content}</span>
  </p>
);

Guidance.propTypes = {
  content: PropTypes.string.isRequired,
};

export default Guidance;
