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
import 'regenerator-runtime/runtime';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas';
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

// Initialise the orchestration object and connect its events to the redux store.
initialiseOrchestration(store.dispatch);

// TODO: decide on where to start based on initial URL here.
// pass join, sessionCode to rootSaga
sagaMiddleware.run(rootSaga, window.location.hash.startsWith('#!/join'));


// Connect the App to the redux store, and add the state and handlers managed by the template.
// - hot() allows the module to be hot-reloaded in development mode.
// - connect() ensures the component is refreshed when any state changes are recorded. It
//   takes functions to transform the state into properties, and likewise, generate handler
//   functions (dispatchers) that can be called from within the component to trigger state updates.
const ConnectedApp = hot(module)(connect(
  state => Object.assign({}, mapTemplateStateToProps(state.template), {
    // Add any additional properties managed by your own reducers here.
  }),
  dispatch => Object.assign({}, mapTemplateDispatchToProps(dispatch), {
    // Add any additional dispatchers needed for your own reducers here.
  }),
)(App));

// Instantiate the ConnectedApp component and render it to the root div tag in the index.html
// template so it appears on the page. Wrap it in the redux provider, to make the state available
// within it (remember, connect() does not add the props by itself, but the component it creates
// accesses it through the Provider).
/* eslint-disable react/jsx-filename-extension */
render(
  <Provider store={store}>
    <ConnectedApp />
  </Provider>,
  document.getElementById('app'),
);
