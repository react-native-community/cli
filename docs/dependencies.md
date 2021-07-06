# Dependency

A dependency is a JavaScript package that is listed under dependencies present in the project's `package.json`. It can also contain native, platform-specific files that should be linked.

For example, `lodash` is a dependency that doesn't have any native code to link. On the other hand, `react-native-vector-icons` is a dependency that contains not only native code, but also font assets that the CLI should link.

By default, CLI analyses the folder structure inside the dependency and looks for assets and native files to link. This simple heuristic works in most of the cases.

At the same time, a dependency can explicitly set its configuration in case CLI cannot infer it properly. A dependency can also define additional settings, such as a script to run after linking, in order to support some advanced use-cases.

## How does it work?

A dependency can define the following `react-native.config.js` at the root:

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        project: './Custom.xcodeproj'
      }
    }
    assets: ['./assets']
  }
};
```

> The above configuration informs CLI of the additional assets to link and about a custom project location.

## Dependency interface

The following type describes the configuration of a dependency that can be set under `dependency` key inside `react-native.config.js`.

```ts
type DependencyConfigT = {
  platforms: {
    [key: string]: any;
  };
  assets: string[];
  hooks: {
    [key: string]: string;
  };
};
```

> Note: This interface is subject to breaking changes. We may consider renaming some keys to simplify the configuration further. If you are going to use it, be prepared to update before we ship a stable 0.60.0 release.

### platforms

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform.

In most cases, as a library author, you should not need to define any of these.

The following settings are available on iOS and Android:

```ts
type DependencyParamsIOST = {
  project?: string;
  podspecPath?: string;
  sharedLibraries?: string[];
  configurations?: string[];
};

type DependencyParamsAndroidT = {
  sourceDir?: string;
  manifestPath?: string;
  packageImportPath?: string;
  packageInstance?: string;
  buildTypes?: string[];
  dependencyConfiguration?: string;
};
```

#### platforms.ios.project

Custom path to `.xcodeproj`.

#### platforms.ios.podspecPath

Custom path to `.podspec` file to use when auto-linking. Example: `node_modules/react-native-module/ios/module.podspec`.

#### platforms.ios.sharedLibraries

An array of shared iOS libraries to link with the dependency. E.g. `libc++`. This is mostly a requirement of the native code that a dependency ships with.

#### platforms.ios.scriptPhases

An array of iOS script phases to add to the project. Specifying a `path` property with a path relative to the dependency root will load the contents of the file at the path as the script contents.

**Example:**

```js
// react-native.config.js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        scriptPhases: [
          {
            name: '[MY DEPENDENCY] My Script',
            path: './my_script.sh',
            execution_position: 'after_compile',
          },
        ],
      },
    },
  },
};
```

See [`script_phase` options](https://www.rubydoc.info/gems/cocoapods-core/Pod/Podfile/DSL#script_phase-instance_method) for a full list of available object keys.

#### platforms.ios.configurations

An array of build configurations which will include the dependency. If the array is empty, your dependency will be installed in all configurations. If you're working on a helper library that should only be included in development, such as a replacement for the React Native development menu, you should set this to `['debug']` to avoid shipping the library in a release build. For more details, see [`build configurations`](https://guides.cocoapods.org/syntax/podfile.html#pod).

#### platforms.android.sourceDir

A relative path to a folder with Android project (Gradle root project), e.g. `./path/to/custom-android`. By default, CLI searches for `./android` as source dir.

#### platforms.android.manifestPath

Path to a custom `AndroidManifest.xml`

#### platforms.android.packageImportPath

Custom package import. For example: `import com.acme.AwesomePackage;`.

#### platforms.android.packageInstance

Custom syntax to instantiate a package. By default, it's a `new AwesomePackage()`. It can be useful when your package requires additional arguments while initializing.

For settings applicable on other platforms, please consult their respective documentation.

#### platforms.android.buildTypes

An array of build variants or flavors which will include the dependency. If the array is empty, your dependency will be included in all build types. If you're working on a helper library that should only be included in development, such as a replacement for the React Native development menu, you should set this to `['debug']` to avoid shipping the library in a release build. For more details, see [`build variants`](https://developer.android.com/studio/build/build-variants#dependencies).

### platforms.android.dependencyConfiguration

A string that defines which method other than `implementation` do you want to use
for autolinking inside `build.gradle` i.e: `'embed project(path: ":$dependencyName", configuration: "default")',` - `"dependencyName` will be replaced by the actual package's name. You can achieve the same result by directly defining this key per `dependency` _(without placeholder)_ and it will have higher priority than this option.

### assets

An array of assets folders to glob for files to link.

### hooks

A map where key is the name of a hook and value is the path to a file to execute.

For example, `link` command supports `prelink` and `postlink` hooks to run before and after linking is done.

These are the only ones supported by CLI at the moment. Depending on the packages used in your project, you may find other hooks supported to.

> Note: This has nothing to do with React Hooks.

## Migrating from `rnpm` configuration

The changes are mostly cosmetic so the migration should be pretty straight-forward.

> Note: We read `rnpm` configuration to remain backwards-compatible. Dependency maintainers should update their configuration in the nearest future.

### Changing the configuration

Properties were renamed. Look at the following example for the differences.

```json
{
  "rnpm": {
    "ios": {},
    "android": {},
    "assets": ["./path-to-assets"],
    "hooks": {
      "prelink": "./path-to-a-prelink-hook"
    }
  }
}
```

to a `react-native.config.js`

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {},
    },
    assets: ['./path-to-assets'],
    hooks: {
      prelink: './path-to-a-prelink-hook',
    },
  },
};
```

### Asking for params while linking has been removed

If your library needs it, do not upgrade over to the new config format.

If you want to ask users for additional settings, consider setting a custom `postlink` hook, just like [`react-native-code-push`](https://github.com/Microsoft/react-native-code-push/blob/master/package.json#L53).
