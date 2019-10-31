import React from 'react';

const ObjectBehaviour = ({
  name,
  active,
}) => (
  <span className={`object-behaviour ${active ? 'active' : ''}`}>
    {name}
  </span>
);

export default ObjectBehaviour;
