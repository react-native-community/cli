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
      linkConfig: ios.linkConfig,
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      linkConfig: android.linkConfig,
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

### npmPackageName

Returns the name of the npm package that should be used as the source for react-native JS code for platforms that provide platform specific overrides to core JS files. This causes the default metro config to redirect imports of react-native to another package based when bundling for that platform. The package specified should provide a complete react-native implementation for that platform.

If this property is not specified, it is assumed that the code in core `react-native` works for the platform.

### projectConfig

Returns a project configuration for a given platform or `null`, when no project found. This is later used inside `linkConfig` to perform linking and unlinking.

First argument is a root folder where the project is located.

Second argument is everything that users defined under:

```js
module.exports = {
  project: {
    [yourPlatformKey]: {},
  },
};
```

> Note: You may find this useful in order to alter the default behavior of your function. For example, on iOS, we find an `.xcodeproj` by globbing the project files and taking the first match. There's a possibility we pick the wrong one in case the project has multiple `.xcodeproj` files. In order to support this use-case, we have allowed users to define an exact path to an iOS project in order to overwrite our `glob` mechanism.

On Android and iOS, this function returns:

```ts
type ProjectConfigIOST = {
  sourceDir: string;
  folder: string;
  pbxprojPath: string;
  podfile: null;
  podspecPath: null;
  projectPath: string;
  projectName: string;
  libraryFolder: string;
  sharedLibraries: Array<any>;
  plist: Array<any>;
};

type ProjectConfigAndroidT = {
  sourceDir: string;
  isFlat: boolean;
  folder: string;
  stringsPath: string;
  manifestPath: string;
  buildGradlePath: string;
  settingsGradlePath: string;
  assetsPath: string;
  mainFilePath: string;
  packageName: string;
  packageFolder: string;
  appName: string;
  dependencyConfiguration?: string;
};
```

We suggest performing all side-effects inside this function (such as resolving paths to native files) and making `linkConfig` functions pure, operating on provided data.

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

On Android and iOS, this function returns:

```ts
type DependencyConfigIOST = ProjectConfigIOST;

type DependencyConfigAndroidT = {
  sourceDir: string;
  folder: string;
  packageImportPath: string;
  packageInstance: string;
  manifestPath: string;
  packageName: string;
  dependencyConfiguration?: string;
};
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

## Migrating from `rnpm` configuration

The changes are mostly cosmetic so the migration should be pretty straight-forward.

### Changing the configuration for a platform

A `platform` property would need to be renamed to `platforms`. `haste` is no longer supported - we are able to infer that automatically.

For example:

```json
{
  "rnpm": {
    "haste": {
      "platforms": ["windows"],
      "providesModuleNodeModules": ["react-native-windows"]
    },
    "platform": "./local-cli/platform.js"
  }
}
```

to `react-native.config.js`

```js
module.exports = {
  platforms: {
    windows: require('./local-cli/platform.js').windows,
  },
};
```

> The above configuration is taken from `react-native-windows` and adds support for `windows` platform.

### Changing platform configuration for a [`dependency`](./dependencies.md)

Platform keys are now under `dependency.platforms`.

For example:

```json
{
  "rnpm": {
    "ios": {
      "project": "PathToCustomProject.xcodeproj"
    }
  }
}
```

to `react-native.config.js`

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        project: 'PathToCustomProject.xcodeproj',
      },
    },
  },
};
```

> The above is a configuration of a dependency that explicitly sets a path to `.xcodeproj`.

### Changing platform configuration for a [`project`](./projects.md)

Platform keys are now under `project.platforms`.

For example:

```json
{
  "rnpm": {
    "ios": {
      "project": "PathToCustomProject.xcodeproj"
    }
  }
}
```

to `react-native.config.js`

```js
module.exports = {
  project: {
    ios: {
      project: 'PathToCustomProject.xcodeproj',
    },
  },
};
```

> The above is a configuration of a project that explicitly sets its main `.xcodeproj` project.
