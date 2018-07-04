import React from 'react';
import { hot } from 'react-hot-loader';
import Allocations from './Allocations';

const App = ({ mdoObjects, numDevices }) => (
  <Allocations
    mdoObjects={mdoObjects}
    numDevices={numDevices}
  />
);

export default hot(module)(App);
