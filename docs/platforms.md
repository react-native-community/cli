# Platforms

A platform is a React Native package that enables writing and shipping React Native applications to a new target. 

For example, React Native Windows is a platform, because it allows to run React Native apps on Windows. At the same time, React Native itself is also a platform - it allows to run React Native apps on Android, iOS and tvOS.

Each platform can have an additional configuration for the CLI to enable bundling apps and linking  and packages for targets it provides.

## How does it work?

A platform can define the following `react-native.config.js` at the root:
```js
const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');

module.exports = {
  platforms: {
    ios: {
      linkConfig: ios.linkConfig,
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig
    },
    android: {
      linkConfig: android.linkConfig,
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig
    }
  }
}
```
> The above config adds support for linking Android and iOS dependencies by the CLI as well as bundling code for these platforms. This config can be found in [React Native repository](https://github.com/facebook/react-native/blob/0.60-stable/react-native.config.js) from 0.60 version on. 

At the startup, React Native CLI reads configuration from all dependencies listed in `package.json` and reduces them into a single configuration. 

At the end, a map of available platforms is passed to the bundler (Metro) to make it aware of the platforms available. This allows APIs such as `Platform.select` and requiring files with platform extensions to work properly.

## Platform interface

```ts
type PlatformConfig<ProjectParams, ProjectConfig, DependencyConfig> = {
  projectConfig: (string, ProjectParams) => ?ProjectConfig,
  dependencyConfig: (string, ProjectParams) => ?DependencyConfig,
  linkConfig: () => {
    isInstalled: (ProjectConfig, string, DependencyConfig) => boolean,
    register: (string, DependencyConfig, Object, ProjectConfig) => void,
    unregister: (
      string,
      DependencyConfig,
      ProjectConfig,
      Array<DependencyConfig>,
    ) => void,
    copyAssets: (string[], ProjectConfig) => void,
    unlinkAssets: (string[], ProjectConfig) => void,
  },
};
```

### projectConfig

Returns a project configuration for a given platform. This is later used inside `linkConfig` to perform linking and unlinking.

First argument is a root folder where the project is located. 

Second argument is everything that users defined under:
```js
module.exports = {
  project: {
    [yourPlatformKey]: {}
  }
}
```

> Note: You may find this useful in order to alter the default behavior of your function. For example, on iOS, we find an `.xcodeproj` by globbing the project files and taking the first match. There's a possibility we pick the wrong one in case the project has multiple `.xcodeproj` files. In order to support this use-case, we have allowed users to define an exact path to an iOS project in order to overwrite our `glob` mechanism.

We suggest performing all side-effects inside this function (such as resolving paths to native files) and making `linkConfig` functions pure, operating on provided data.

### dependencyConfig

Similar to [`projectConfig`](#projectconfig) above, but for a dependency of a project. 

First argument is a path to a root folder of a dependency.

Second argument is everything that dependency authors defined under:
```js
module.exports = {
  dependency: {
    [yourPlatformKey]: {}
  }
}
```

### linkConfig

Returns an object with utilities that are run by the CLI while linking. 

> Note: The following is deprecated and will stop working in the future. Consider providing a [`autolinking`](./autolinking.md) support.

#### linkConfig.isInstalled

Returns true if a library is already linked to a given project. False otherwise.

#### linkConfig.register

Performs platform-specific steps in order to link a library.

#### linkConfig.unregister

Performs platform-specific steps in order to unlink a library.

#### linkConfig.copyAssets

Performs platform-specific steps in order to copy assets of a library to a project.

#### linkConfig.unlinkAssets

Performs platform-specific steps in order to unlink assets of a library from a project.



