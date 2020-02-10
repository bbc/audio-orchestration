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
import '@babel/polyfill';
import 'whatwg-fetch';

// Import React and ReactDOM, to render React components to the page.
import React from 'react';
import { hot } from 'react-hot-loader';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
import {
  createStore,
  applyMiddleware,
  combineReducers,
  compose,
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
import config, { updateConfig } from './config';
import { initialiseOrchestration } from './template/orchestration';

import { reducers, mapTemplateStateToProps, mapTemplateDispatchToProps } from './template';

// The App is the top level presentational component. You may add, remove, or edit components used
// by it to change the layout to fit your specific application.
import App from './presentation/App';

// Create a Redux store. This library is used to manage state by the template. You may wish
// to extend this by adding your own reducers, but that should not be neccessary for basic use.
// The redux devtools are also enabled: https://github.com/zalmoxisus/redux-devtools-extension
// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  combineReducers({
    template: reducers,
    // Add your own reducers here if you wish to use custom reducers.
  }),
  composeEnhancers(applyMiddleware(sagaMiddleware)),
);

// Connect the App to the redux store, and add the state and handlers managed by the template.
// - hot() allows the module to be hot-reloaded in development mode.
// - connect() ensures the component is refreshed when any state changes are recorded. It
//   takes functions to transform the state into properties, and likewise, generate handler
//   functions (dispatchers) that can be called from within the component to trigger state updates.
const ConnectedApp = hot(module)(connect(
  // Add any additional properties managed by your own reducers here.
  (state) => ({ ...mapTemplateStateToProps(state.template) }),
  // Add any additional dispatchers needed for your own reducers here.
  (dispatch) => ({ ...mapTemplateDispatchToProps(dispatch) }),
)(App));

// Instantiate the ConnectedApp component and render it to the root div tag in the index.html
// template so it appears on the page. Wrap it in the redux provider, to make the state available
// within it (remember, connect() does not add the props by itself, but the component it creates
// accesses it through the Provider).
global.initOrchestrationTemplate = (element, userConfig = {}) => {
  // Write the config
  updateConfig(userConfig);

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
      <ConnectedApp />
    </Provider>,
    element,
  );
};
