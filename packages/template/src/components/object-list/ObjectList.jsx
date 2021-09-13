import React from 'react';
import PropTypes from 'prop-types';

const ObjectList = ({
  objectIds,
}) => (
  <ul className="object-list">
    { objectIds.map((objectId) => (
      <li key={objectId}>
        {`${objectId}`}
      </li>
    ))}
  </ul>
);

ObjectList.propTypes = {
  objectIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ObjectList;
