import bbcat from 'bbcat';
import DashAudio, { renderTypes } from './audio';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

const assetsUrl = 'http://vm-1015-user.virt.ch.bbc.co.uk/dash/assets.json';

const context = new AudioContext();
const dashAudio = new DashAudio(context);

new bbcat.core.Loader('json')
  .load(assetsUrl)
  .catch((error) => {
    ReactDOM.render(
      <p>Could not load assets: {error.message}</p>,
      document.getElementById('app')
    );
  })
  .then((response) => {
    dashAudio.renderType = renderTypes[0];
    dashAudio.manifestUrl = response.assets[0].url;

    ReactDOM.render(
      <App
        dashAudio={dashAudio}
        renderTypes={renderTypes}
        assetsList={response.assets}
      />,
      document.getElementById('app')
    );
  });
