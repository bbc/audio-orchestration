import ReactDOM from 'react-dom';
import React from 'react';
import Sequence from 'bbcat-orchestration/src/sequence-renderer/sequence';
import App from './App';

function render(sequence = null) {
  const numDevices = 8;
  let mdoObjects = [];

  // extract MDO metadata from sequence's list of objects.
  if (sequence !== null) {
    mdoObjects = sequence.objectIds.map(objectId => sequence.getOrchestrationData(objectId));
  }

  ReactDOM.render(React.createElement(App, {
    mdoObjects,
    numDevices,
  }), document.getElementById('app'));
}

render();

fetch('sequence.json')
  .then((response) => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('could not download sequence');
  })
  .then((sequenceData) => {
    render(new Sequence(sequenceData));
  })
  .catch((e) => { console.error('error', e); });
