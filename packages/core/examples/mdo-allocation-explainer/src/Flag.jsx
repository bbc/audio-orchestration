import React from 'react';

const Flag = ({
  name,
  value,
}) => (
  <span className={`flag ${value ? 'checked' : ''}`}>
    <input type="checkbox" disabled checked={value} />
    {name}
  </span>
);

export default Flag;
