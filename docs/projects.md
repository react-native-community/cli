# Project

A project is an app that contains React code and has a dependency on `react-native`.

Projects can provide additional properties to alter the CLI behavior, such as custom location of React Native files (this is useful when running RNTester from source) or a non-standard location of a project (useful when working in a brownfield app).

## How does it work?

A project can define the following `react-native.config.js` at the root:

```js
module.exports = {
  project: {
    platforms: {
      ios: {
        project: './Custom.xcodeproj',
      },
    },
  },
};
```

> The above configuration informs CLI about a custom project location.

## Project interface

```ts
interface Config = {
  reactNativePath: string;
  project: ProjectConfig;
  dependencies: {[key: string]: Dependency};
  platforms: {
    android: PlatformConfig<
      AndroidProjectConfig,
      AndroidProjectParams,
      AndroidDependencyConfig,
      AndroidDependencyParams
    >;
    ios: PlatformConfig<
      IOSProjectConfig,
      IOSProjectParams,
      IOSDependencyConfig,
      IOSDependencyParams
    >;
    [name: string]: PlatformConfig<any, any, any, any>;
  };
  commands: Command[];
}
```

### reactNativePath

A custom path to React Native, in case `require('react-native')` would throw. Useful when running
React Native from a (custom) source.

### project

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform.

In most cases, as a React Native developer, you should not need to define any of these.

The following settings are available on iOS and Android:

```ts
interface AndroidProjectParams {
  sourceDir?: string;
  appName?: string;
  manifestPath?: string;
  packageName?: string;
}

interface IOSProjectParams {
  project?: string;
  scriptPhases?: Array<any>;
}
```

### platforms

A object with platforms defined inside a project. You can check the format and options available [`here`](platforms.md#platform-interface)

### commands

An array of commands defined inside a project. You can check the format and options available [`here`](plugins.md#command-interface)

### dependencies

Dependencies is a map where key is the name of the dependency and value is an object that can override any of the resolved settings for a particular package.

For example, you could set:

```js
module.exports = {
  dependencies: {
    'react-native-webview': {
      platforms: {
        ios: null,
      },
    },
  },
};
```

in order to disable linking of React Native WebView on iOS.

Another use-case would be supporting local libraries that are not discoverable for autolinking, since they're not part of your `dependencies` or `devDependencies`:

```js
module.exports = {
  dependencies: {
    'local-rn-library': {
      root: '/root/libraries',
    },
  },
};
```

The object provided here is deep merged with the dependency config. Check [`projectConfig`](platforms.md#projectconfig) and [`dependencyConfig`](platforms.md#dependencyConfig) return values for a full list of properties that you can override.

> Note: This is an advanced feature and you should not need to use it mos of the time.

## Migrating from `rnpm`

Support for `rnpm` has been removed with the 4.x release of the CLI. If your project or library still uses `rnpm` for altering the behaviour of the CLI, please check [documentation of the older CLI release](https://github.com/react-native-community/cli/blob/3.x/docs/projects.md#migrating-from-rnpm-configuration) for steps on how to migrate.
