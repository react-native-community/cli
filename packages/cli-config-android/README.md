# @react-native-community/cli-config-android

This package is part of the [React Native CLI](../../README.md). It contains utilities for autolinking on Android platform.

## Installation

```sh
yarn add @react-native-community/cli-config-android
```

## Usage

This package is intended to be used internally in [React Native CLI](../../README.md) and by out of tree platforms.

`cli-config-android` exports utilities to create OOT platform config for autolinking.

- `getProjectConfig()` - creates project config for given platform
- `getDependencyConfig()` - creates dependency config for given platform

Example (`<oot-platform>/packages/react-native/react-native.config.js`):

```js
  platforms: {
    android: {
      projectConfig: getProjectConfig(),
      dependencyConfig: getDependencyConfig(),
    },
    ..
  },
```
