# Project

A project is an app that contains React code and has a dependency on `react-native`.

Projects can provide additional properties to alter the CLI behavior, such as custom location of React Native files (this is useful when running RNTester from source) or a non-standard location of a project (useful when working in a brownfield app).

## How does it work?

A project can define a `react-native.config.js` at the root with custom configuration to be picked up by the CLI.

For example, below configuration informs CLI of the additional assets to link and about a custom project location.

```js
module.exports = {
  project: {
    ios: {
      project: './CustomProject.xcodeproj',
    },
  },
  assets: ['./assets'],
};
```

You can check all available options below.

## Project interface

```ts
type ProjectConfigT = {
  reactNativePath: ?string,
  project: {
    android?: ProjectParamsAndroidT,
    ios?: IOSProjectParams,
    [key: string]: any,
  },
  assets: string[],
  platforms: PlatformT,
  dependencies: {
    [key: string]: {
      name: string,
      root: string,
      platforms: {
        [key: string]: PlatformSettingsT
      },
      assets: string[],
      hooks: {
        [key: string]: string
      }
    },
  },
  commands: CommandT[]
};
```

### reactNativePath

A custom path to React Native, in case `require('react-native')` would throw. Useful when running
React Native from a (custom) source.

### project

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform.

In most cases, as a React Native developer, you should not need to define any of these.

The following settings are available on iOS and Android:

```ts
type AndroidProjectParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  packageFolder?: string;
  mainFilePath?: string;
  stringsPath?: string;
  settingsGradlePath?: string;
  assetsPath?: string;
  buildGradlePath?: string;
  appName?: string; // A name of the app in the Android `sourceDir`, equivalent to Gradle project name. By default it's `app`.
  dependencyConfiguration?: string;
};

type IOSProjectParams = {
  project?: string;
  podspecPath?: string;
  sharedLibraries?: string[];
  libraryFolder?: string;
  plist: Array<any>;
  scriptPhases?: Array<any>;
};
```

### assets

An array of folders to check for project assets

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

or you could set:

```js
module.exports = {
  dependencies: {
    'react-native-brownfield': {
      platforms: {
        android: {
          dependencyConfiguration:
            'embed project(path: ":react-native-brownfield-bridge", configuration: "default")',
        },
      },
    },
  },
};
```

in order to use something else than `implementation` _(default scope method)_

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

## Migrating from `rnpm` configuration

The changes are mostly cosmetic so the migration should be pretty straight-forward.

### Changing the configuration

Properties `ios` and `android` were moved under `project`. Take a look at the following example for the differences.

```json
{
  "rnpm": {
    "ios": {},
    "android": {},
    "assets": ["./path-to-assets"]
  }
}
```

to a `react-native.config.js`

```js
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./path-to-assets'],
};
```
