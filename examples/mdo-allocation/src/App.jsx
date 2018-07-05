import React from 'react';
import { hot } from 'react-hot-loader';
import Allocations from './Allocations';

const App = ({ objects, numDevices }) => (
  <Allocations
    objects={objects}
    numDevices={numDevices}
  />
);

export default hot(module)(App);
