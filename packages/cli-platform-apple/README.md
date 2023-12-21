# @react-native-community/cli-platform-apple

This package is part of the [React Native CLI](../../README.md). It contains utilities for building reusable commands targetting Apple platforms.

## Installation

```sh
yarn add @react-native-community/cli-platform-apple
```

## Usage

This package is intended to be used internally in [React Native CLI](../../README.md) and by out of tree platforms.

It exports builder commands that can be used to create custom `run-`, `log-` and `build-` commands for example: `yarn run-<oot-platform>`.

Inside of `<oot-platform>/packages/react-native/react-native.config.js`:

```js
const {
  getBuildOptions,
  createBuild,
} = require('@react-native-community/cli-platform-apple');

const buildVisionOS = {
  name: 'build-visionos',
  description: 'builds your app for visionOS platform',
  func: createBuild({platformName: 'visionos'}),
  examples: [
    {
      desc: 'Build the app for visionOS in Release mode',
      cmd: 'npx react-native build-visionos --mode "Release"',
    },
  ],
  options: getBuildOptions({platformName: 'visionos'}),
};

module.exports = {
  commands: [buildVisionOS], // <- Add command here
  //..
};
```

`cli-platform-apple` also exports utilities to create OOT platform config.

- `getProjectConfig()` - creates project config for given platform
- `getDependencyConfg()` - creates dependency config for given platform

Example (`<oot-platform>/packages/react-native/react-native.config.js`):

```js
platforms: {
    visionos: {
      npmPackageName: '@callstack/react-native-visionos',
      projectConfig: getProjectConfig({platformName: 'visionos'}),
      dependencyConfig: getDependencyConfg({platformName: 'visionos'}),
    },
    ..
  },
```
