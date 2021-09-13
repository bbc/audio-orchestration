import React from 'react';

const NamedList = ({
  name,
  items,
}) => (
  <div className="named-list">
    <h3>{name}</h3>
    <ul>
      { items.map(item => <li key={item}>{item}</li>) }
    </ul>
  </div>
);

export default NamedList;
