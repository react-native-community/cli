# @react-native-community/cli-config-apple

This package is part of the [React Native CLI](../../README.md). It contains utilities for building reusable commands targeting Apple platforms.

## Installation

```sh
yarn add @react-native-community/cli-config-apple
```

## Usage

This package is intended to be used internally in [React Native CLI](../../README.md) and by out of tree platforms.

`cli-config-apple` exports utilities to create OOT platform config for autolinking.

- `getProjectConfig()` - creates project config for given platform
- `getDependencyConfig()` - creates dependency config for given platform

Example (`<oot-platform>/packages/react-native/react-native.config.js`):

```js
platforms: {
    visionos: {
      npmPackageName: '@callstack/react-native-visionos',
      projectConfig: getProjectConfig({platformName: 'visionos'}),
      dependencyConfig: getDependencyConfig({platformName: 'visionos'}),
    },
    ..
  },
```
