import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_CODE_LENGTH } from '../../../config';

class SlavePage extends React.Component {
  render() {
    const {
      sessionCode,
    } = this.props;

    return (
      <div className="page page-slave">
        <h1>
          Slave Device
        </h1>

        <p>
          { `Connected to ${sessionCode}` }
        </p>

        <p>
          Player status would go here.
        </p>
      </div>
    );
  }
}

SlavePage.defaultProps = {
  sessionCode: '-'.repeat(SESSION_CODE_LENGTH),
};

SlavePage.propTypes = {
  sessionCode: PropTypes.string,
};

export default SlavePage;
