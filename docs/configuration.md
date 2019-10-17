# Configuration

React Native CLI has a configuration mechanism that allows changing its behavior and providing additional features.

React Native CLI can be configured by creating a `react-native.config.js` at the root of the project. Depending on the type of a package, the set of valid properties is different.

Check the documentation for

- [projects](./projects.md)
- [dependencies](./dependencies.md)
- [platforms](./platforms.md)
- [plugins](./plugins.md)

to learn more about different types of configuration and features available.

## Migration guide

Support for `rnpm` has been removed with the 4.x release of the CLI. If your project or library still uses `rnpm` for altering the behaviour of the CLI, please check [documentation of the older CLI release](https://github.com/react-native-community/cli/blob/3.x/docs/configuration.md) for steps on how to migrate.
