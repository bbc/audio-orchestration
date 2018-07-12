# BBC Audio Toolbox: Device Orchestration Template

This project is an example you can modify to suit your application. Fork this repository, and build
your own orchestrated audio experiences using [React](https://reactjs.org/) and our
[bbcat-orchestration](https://github.com/bbc/bbcat-orchestration) tools.

You should only need to modify this template in three places:

* [src/presentation/](src/presentation/) contains stateless presentational React components, CSS
  stylesheets, and content images. This defines the look and feel of the front end.
* [src/config.js](src/config.js) contains configuration parameters, such as paths to audio files.
* [audio/](audio/) contains the encoded audio files and metadata files describing it.

## Installation and Usage

The development machine should have NodeJS and the yarn package manager (npm may work) installed.

Clone this repository into `my-orchestration-project`:

```sh
git clone git@github.com:bbc/bbcat-orchestration-template.git my-orchestration-project && cd my-orchestration-project
```

Install dependencies:

```sh
yarn install
```

Run a development server:

```sh
yarn dev
```

Build the assets for distribution, these will be placed in the `dist/` directory.

```sh
yarn build
```
