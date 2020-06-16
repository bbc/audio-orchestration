# Orchestration Template

This project is an example you can modify to suit your application. Fork this repository, and build
your own orchestrated audio experiences using [React](https://reactjs.org/) and our
[bbcat-orchestration](https://github.com/bbc/bbcat-orchestration) tools.

## Browser compatibility

Browsers on iOS < 11 may not be supported.

## Usage

This explains how audio assets should be packaged, and how a local copy of the template can be customised
to include the packaged audio, and how the presentational components may be adapted to better suit a
particular experience.

## Development

**To create an experience based on this template, see the [tutorial](tutorial/) instead.** In short,
use `git init` and `git pull` instead of `git clone` to create a fork of this repository.

### Setup

[Node.js](https://nodejs.org/en/) 8+ a is recommended.

Install the dependencies using `yarn`.

NB: some dependencies are installed from the R&D Artifactory registry. See our [ways of working page](https://confluence.dev.bbc.co.uk/display/audioteam/bbcat-orchestration+libraries+and+tools) to set this up.

```sh
yarn install
```

Start a development server:

```sh
yarn dev
```

### Template Structure

This guide is for developers looking to change the template itself, or to understand it a bit better.
It may be useful to read this before trying to make further-reaching changes for an experience building
on the template.

### Main libraries used

You should familiarise yourself with these libraries before attempting to follow the more detailed notes in the sections below.

* [React.js 16](https://reactjs.org/)
* [Redux](https://redux.js.org/) (and [react-redux](https://redux.js.org/basics/usagewithreact))
* [Redux-saga](https://redux-saga.js.org/)
* [bbcat-orchestration](https://github.com/bbc/bbcat-orchestration), only the `OrchestrationClient` interface is directly used in the template.

### Template code: redux actions, reducers, sagas, and the orchestration client

Redux actions are dispatched to the store to effect changes in the state. The sagas (see below) also listen for and dispatch certain actions, and a saga is used to manage the orchestration client---the object that interacts with the synchronisation service and manages audio rendering.

#### `src/template/index.js`

Contains the `mapStateToProps` and `mapDispatchToProps` methods used in the `connect` call in the entry point file. These export the entire state as props, and create all action dispatchers intendend to be called by user interface components.

#### `src/template/actions`

Describes action objects that can be dispatched to the redux store: `index.js` contains generic actions required for the user interface (to move between the pages, for example), and `orchestration.js` contains actions dispatched that may be by the orchestration client, and those that may also modify its state.

#### `src/template/reducers`

Implements a single redux reducer, accepting actions and creating new versions of the global state for any of the state-affecting actions defined above.

#### `src/sagas.js`

Implements the root saga, which starts three sagas:

* `watcherSaga` (background): listens for asynchronous events, currently only used for when a session code needs to be validated.
* `orchestrationWatcherSaga` (background): listens for orchestration-related events, described below
* Depending on parameters passed in the URL, one of the `directJoinFlow`, `joinFlow`, or `startFlow`, which show a join page, a connect page, or the generic start page (allowing to create a session) respectively. Eventually, these defer to either the `auxiliaryFlow` for an auxiliary device, or the `mainFlow` for a main device.

#### `src/template/orchestration.js`

Implements the `orchestrationSaga` and keeps a reference to the global `OrchestrationClient` object. Registers event handlers and thus connects the orchestration client to redux dispatch calls in the `initialiseOrchestration()` method.

The orchestration saga listens for redux actions being dispatched that may affect the orchestration client. For example, the user may click the pause button, leading to a `REQUEST_PAUSE` action being dispatched. The saga forwards this request as a call to `orchestrationClient.pause()`.

When the timeline speed eventually changes to zero as a result of the pause call, a `status` event is generated. This is turned into a `SET_PLAYBACK_STATUS` action dispatched to the redux store, so that the user interface can reflect the change.

#### `src/session.js`

Implements a client for the [session-id-service](https://github.com/bbc/bbcat-orchestration-session-id).

### React components, style sheets, and props

#### `src/index.html`

This is the HTML skeleton used for the page. It is transformed by a webpack plugin to import the final JS and CSS bundles.

#### `src/index.js`

This file is the overall entry point. It imports many things that have to be imported exactly once (JavaScript polyfills, component style). It also sets up the React application (including the state, reducers, and sagas) and renders the top-level `<App />` component.

#### `src/App.jsx`

The `App` component renders the currently active _page_ as set in the state.

#### `src/pages`

Each _page_ renders the presentational components (some of which may be connected to access properties of the state without those being passed as props) for the page contents.

#### `src/components`

Each _component_ contains at least one `.jsx` file defining the React component, and usually it also has a `.scss` file defining the styling. Some components have multiple `.jsx` files for sub-components or to provide a version of the component that is connected to the state.

For the style sheets (`.scss` files), we scope all class names to always begin with the name of the component folder. Where shorter class names are desired, these must be combined with a scoped name to ensure styles don't affect other components.
