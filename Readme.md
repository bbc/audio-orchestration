# BBC Audio Toolbox: Device Orchestration Template

This project is an example you can modify to suit your application. Fork this repository, and build
your own orchestrated audio experiences using [React](https://reactjs.org/) and our
[bbcat-orchestration](https://github.com/bbc/bbcat-orchestration) tools.

You should only need to modify this template in three places:

* [src/presentation/](src/presentation/) contains stateless presentational React components, CSS
  stylesheets, and content images. This defines the look and feel of the front end.
* [src/config.js](src/config.js) contains configuration parameters, such as paths to audio files.
* [audio/](audio/) contains the encoded audio files and metadata files describing the sequences.

## Usage

A detailed tutorial for using this template, including setting up the required tools on a new machine,
is included in the [tutorial/](tutorial/) directory.

This explains how audio assets should be packaged, and how a local copy of the template can be customised
to include the packaged audio, and how the presentational components may be adapted to better suit a
particular experience.

For an implementation using this template, but adding a lot of custom functionality on top of it, see
the [repository](https://github.com/bbc/rd-audio-vostok) for _The Vostok-K Incident_.

## Development

**To create an experience based on this template, see the [tutorial](tutorial/) instead.** In short,
use `git init` and `git pull` instead of `git clone` to create a fork of this repository.

### Setup

[Node.js](https://nodejs.org/en/) 8+ a is recommended.

Install the dependencies using `npm` (`yarn` may not work with some older dependencies!):

```sh
npm install
```

Start a development server:

```sh
npm run dev
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

#### `src/index.js`

Initialises the redux store, starts the root saga, and initialises the orchestration client (`initialiseOrchestration`). Renders the top-level `App` component. Also includes various polyfills and the web font package.

As the template is designed to be extended, only the `state.template` property of the global state is used by reducers introduced by the template. Further reducers specific to a particular experience may be created and should be registered in the `createStore` call in `src/index.js` and provide their own `mapStateToProps` and `mapDispatchToProps` functions in the `connect` call.

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
* Depending on parameters passed in the URL, one of the `directJoinFlow`, `joinFlow`, or `startFlow`, which show a join page, a connect page, or the generic start page (allowing to create a session) respectively. Eventually, these defer to either the `slaveFlow` for an auxiliary device, or the `masterFlow` for a main device.

#### `src/template/orchestration.js`

Implements the `orchestrationSaga` and keeps a reference to the global `OrchestrationClient` object. Registers event handlers and thus connects the orchestration client to redux dispatch calls in the `initialiseOrchestration()` method.

The orchestration saga listens for redux actions being dispatched that may affect the orchestration client. For example, the user may click the pause button, leading to a `REQUEST_PAUSE` action being dispatched. The saga forwards this request as a call to `orchestrationClient.pause()`.

When the timeline speed eventually changes to zero as a result of the pause call, a `status` event is generated. This is turned into a `SET_PLAYBACK_STATUS` action dispatched to the redux store, so that the user interface can reflect the change.

#### `src/session.js`

Implements a client for the [session-id-service](https://github.com/bbc/bbcat-orchestration-session-id).

### React components and props

Currently, the entire state is set as props on the top-level `App` component. This passes all its props as props to the `CurrentPage` component. Each of the pages implemented in `src/presentation/Pages/` can then pick and choose and pass on the required props to its children.

_A better pattern for passing state through to presentational components, for example using higher-order components, could probably be devised. As this is only a starting point for a very simple interface, this effort has not yet been put in. You're welcome to contribute if you have strong opinions about how this might be done more cleanly!_

