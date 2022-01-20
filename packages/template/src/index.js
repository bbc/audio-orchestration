/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * This file is the entry point to the application. It should not be modified.
 *
 * It links together the stateful components in the template/ directory with the project-specific
 * presentational components in the presentation/ directory.
 *
 * To customise the front-end for your project, you should only need to modify the presentational
 * components, images, and stylesheets in presentation/.
 */

// Import polyfills to patch features not natively supported in older browsers
// General ES2015 features (Promises, Object.assign, etc.)
import 'core-js/stable';
// Generator functions (used in redux-saga)
import 'regenerator-runtime/runtime';
// fetch (used in orchestration library to download sequence data)
import 'whatwg-fetch';
// pointer events (used for touch and mouse events in seek bar)
import 'pepjs';

// Import React and ReactDOM, to render React components to the page.
import { hot } from 'react-hot-loader';
import React from 'react';
import { render } from 'react-dom';
import {
  connect,
  Provider,
} from 'react-redux';
import {
  createStore,
  applyMiddleware,
  compose,
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'sagas';
import config, { updateConfig } from 'config';
import { initialiseOrchestration } from './template/orchestration';

import reducer from './template/reducer';

// The App is the top level presentational component. You may add, remove, or edit components used
// by it to change the layout to fit your specific application.
import App from './App';

// Import the CSS
import './main.scss';

// Import CSS for all components used at the top level
import 'components/button/Button.scss';
import 'components/page-filler/PageFiller.scss';
import 'components/page-overflow/PageOverflow.scss';
import 'components/page-contents/PageContents.scss';
import 'components/status-bar/StatusBar.scss';
import 'components/player-image/PlayerImage.scss';
import 'components/player-title/PlayerTitle.scss';
import 'components/player-controls/PlayerControls.scss';
import 'components/icon/Icon.scss';
import 'components/input/Input.scss';
import 'components/choices/Choices.scss';
import 'components/controls/Controls.scss';
import 'components/object-list/ObjectList.scss';
import 'components/share/Share.scss';
import 'components/footer/Footer.scss';
import 'components/instructions-session-code/InstructionsSessionCode.scss';
import 'components/qr-code/QRCode.scss';
import 'components/device-list/DeviceList.scss';
import 'components/calibration-controls/CalibrationControls.scss';
import 'components/device-info/DeviceInfo.scss';
import 'components/rating-prompt/RatingPrompt.scss';
import 'components/lighting-effect/LightingEffect.scss';
import 'components/thumbnail-choices/ThumbnailChoices.scss';
import 'components/onboarding-instructions/OnboardingInstructions.scss';
import 'components/overlay-prompt/OverlayPrompt.scss';

// Create a Redux store. This library is used to manage state by the template. You may wish
// to extend this by adding your own reducers, but that should not be neccessary for basic use.
// The redux devtools are also enabled: https://github.com/zalmoxisus/redux-devtools-extension
// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(sagaMiddleware)),
);

// connect() allows us to pass the page property of the state into the App component
const mapStateToProps = (state) => ({
  page: state.page,
});
const ConnectedApp = connect(mapStateToProps)(App);

// hot() allows the module to be hot-reloaded in development mode
const HotConnectedApp = hot(module)(ConnectedApp);

// Instantiate the ConnectedApp component and render it to the root div tag in the index.html
// template so it appears on the page. Wrap it in the redux provider, to make the state available
// within it (remember, connect() does not add the props by itself, but the component it creates
// accesses it through the Provider).
global.initOrchestrationTemplate = (element, userConfig = {}) => {
  // Write the config
  updateConfig(userConfig);

  // Add a style block for the custom accent colour
  if (config.ACCENT_COLOUR) {
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = [
      `body { --accent-color: ${config.ACCENT_COLOUR}; }`,
      `.accent-colour-background { background-color: ${config.ACCENT_COLOUR}; }`,
      `.accent-colour-text { color: ${config.ACCENT_COLOUR}; }`,
      `.accent-colour-border { border-color: ${config.ACCENT_COLOUR}; }`,
    ].join('\n');
    document.head.appendChild(styleBlock);
  }

  // Initialise the orchestration object and connect its events to the redux store.
  const deviceId = initialiseOrchestration(store.dispatch);
  const sessionCodeExpression = new RegExp(`^#!/join/([0-9]{${config.SESSION_CODE_LENGTH}})$`);
  const matches = window.location.hash.match(sessionCodeExpression);

  // Start the saga middleware, starting either on the start or join page.
  sagaMiddleware.run(rootSaga, {
    join: window.location.hash.startsWith('#!/join'),
    sessionCode: matches ? matches[1] : null,
    deviceId,
  });

  // Render the connected component into the provided target element
  /* eslint-disable react/jsx-filename-extension */
  render(
    <Provider store={store}>
      <HotConnectedApp />
    </Provider>,
    element,
  );
};
