import React from 'react';
import PropTypes from 'prop-types';

const ObjectList = ({
  objectIds,
}) => (
  <p className="object-list">
    { objectIds.map(objectId => (
      <span key={objectId} style={{ display: 'inline-block', margin: '4px' }}>
        {`${objectId}`}
      </span>
    ))}
  </p>
);

ObjectList.propTypes = {
  objectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ObjectList;
