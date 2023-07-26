# @react-native-community/cli-clean

This package is part of the [React Native CLI](../../README.md). It contains commands for cleaning the build artifacts.

## Installation

```sh
yarn add @react-native-community/cli-clean
```

## Commands

### `clean`

Usage:

```sh
npx react-native clean
```

Cleans caches. Commonly used to ensure build failures are not due to stale cache. By default, it will prompt which caches to purge, with Watchman and Metro already checked. To omit interactive prompt (e.g. in scripts), please use `--include` flag.

#### Options

#### `--include <string>`

Comma-separated flag of caches to clear e.g. `npm,yarn`. If omitted, an interactive prompt will appear. Valid values include `android`, `cocoapods`, `metro`, `npm`, `watchman`, and `yarn`.

#### `--project-root <string>`

> default: current working directory

Root path to your React Native project. When not specified, defaults to current working directory.

#### `--verify-cache`

> default: false

Whether to verify the cache. Currently only applies to npm cache.
