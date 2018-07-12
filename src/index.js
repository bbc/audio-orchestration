/**
 * This file is the entry point to the application. It should not be modified.
 *
 * It links together the stateful components in the template/ directory with the project-specific
 * presentational components in the presentation/ directory.
 *
 * To customise the front-end for your project, you should only need to modify the presentational
 * components, images, and stylesheets in presentation/.
 */
import ReactDOM from 'react-dom';
import React from 'react';
import App from './presentation/App';

ReactDOM.render(React.createElement(App, {}), document.getElementById('app'));
