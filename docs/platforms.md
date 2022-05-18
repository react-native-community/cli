# Platforms

A platform is a React Native package that enables writing and shipping React Native applications to a new target.

For example, React Native Windows is a platform, because it allows to run React Native apps on Windows. At the same time, React Native itself is also a platform - it allows to run React Native apps on Android, iOS and tvOS.

Each platform can have an additional configuration for the CLI to enable bundling apps and linking packages for targets it provides.

## How does it work?

A platform can define the following `react-native.config.js` at the root:

```js
const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');

module.exports = {
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
  },
};
```

> The above config adds support for linking Android and iOS dependencies by the CLI as well as bundling code for these platforms. This config can be found in [React Native repository](https://github.com/facebook/react-native/blob/0.60-stable/react-native.config.js) from 0.60 version on.

At the startup, React Native CLI reads configuration from all dependencies listed in `package.json` and reduces them into a single configuration.

At the end, a map of available platforms is passed to the bundler (Metro) to make it aware of the platforms available. This allows APIs such as `Platform.select` and requiring files with platform extensions to work properly.

## Platform interface

```ts
type PlatformConfig<ProjectParams, ProjectConfig, DependencyConfig> = {
  npmPackageName?: string;
  projectConfig: (string, ProjectParams) => ?ProjectConfig;
  dependencyConfig: (string, ProjectParams) => ?DependencyConfig;
};
```

### npmPackageName

Returns the name of the npm package that should be used as the source for react-native JS code for platforms that provide platform specific overrides to core JS files. This causes the default metro config to redirect imports of react-native to another package based when bundling for that platform. The package specified should provide a complete react-native implementation for that platform.

If this property is not specified, it is assumed that the code in core `react-native` works for the platform.

### projectConfig

Returns a project configuration for a given platform or `null`, when no project found.

First argument is a root folder where the project is located.

Second argument is everything that users defined under:

```js
module.exports = {
  project: {
    [yourPlatformKey]: {},
  },
};
```

> Note: You may find this useful in order to alter the default behavior of your function. For example, on iOS, we find a `Podfile` by globbing the project files and taking the first match. There's a possibility we pick the wrong one in case the project has multiple `Podfile` files. In order to support this use-case, we have allowed users to define an iOS directory where the desired `Podfile` is located.

On Android and iOS, this function returns:

```ts
type IOSProjectConfig = {
  sourceDir: string;
  xcodeProject: {
    name: string;
    isWorkspace: boolean;
  } | null;
};

type AndroidProjectConfig = {
  sourceDir: string;
  appName: string;
  packageName: string;
  dependencyConfiguration?: string;
};
```

### dependencyConfig

Similar to [`projectConfig`](#projectconfig) above, but for a dependency of a project.

First argument is a path to a root folder of a dependency.

Second argument is everything that dependency authors defined under:

```js
module.exports = {
  dependency: {
    [yourPlatformKey]: {},
  },
};
```

On Android and iOS, this function returns a dependency configuration for:

```ts
type IOSDependencyConfig = {
  podspecPath: string;
  scriptPhases: Array<IOSScriptPhase>;
  configurations: string[];
};

type AndroidDependencyConfig = {
  sourceDir: string;
  packageImportPath: string;
  packageInstance: string;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  androidMkPath?: string | null;
};
```
