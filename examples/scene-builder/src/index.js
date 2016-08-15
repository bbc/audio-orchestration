import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reducer from './reducer';
import App from './containers/App';
import AudioGraph from './audio';

const audioGraph = new AudioGraph();
// eslint-disable-next-line no-unused-vars
const audioGraphHandler = store => next => action => {
  audioGraph.handle(action);
  return next(action);
};

/* eslint-disable no-console */
const logger = store => next => action => {
  console.group(action.type);
  console.info('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  console.groupEnd(action.type);
  return result;
};
/* eslint-enable no-console */

const store = createStore(
  reducer,
  applyMiddleware(audioGraphHandler, logger)
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
