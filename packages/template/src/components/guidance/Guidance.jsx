/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
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
