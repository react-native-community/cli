# Dependency

A dependency is a JavaScript package that is listed under dependencies present in the project's `package.json`. It can also contain native, platform-specific files that should be linked.

For example, `lodash` is a dependency that doesn't have any native code to link. On the other hand, `react-native-vector-icons` is a dependency that contains not only native code, but also font assets that the CLI should link.

By default, CLI analyses the folder structure inside the dependency and looks for assets and native files to link. This simple heuristic works in most of the cases.

At the same time, a dependency can explicitly set its configuration in case CLI cannot infer it properly.

## How does it work?

A dependency can define the following `react-native.config.js` at the root:

```js
module.exports = {
  dependency: {
    platforms: {
      ios: {
        project: './Custom.xcodeproj',
      },
    },
  },
};
```

> The above configuration informs CLI about a custom project location.

## Dependency interface

The following type describes the configuration of a dependency that can be set under `dependency` key inside `react-native.config.js`.

```ts
interface Dependency = {
  platforms: {
    ios?: IOSDependencyParams | null;
    android?: AndroidDependencyParams | null;
    [key: string]: any;
  };
};
```

### platforms

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform.

In most cases, as a library author, you should not need to define any of these.

The following settings are available on iOS and Android:

```ts
interface IOSDependencyParams {
  project?: string;
  podspecPath?: string;
  scriptPhases?: Array<{
    name: string;
    path: string;
    execution_position: string;
  }>;
}

interface AndroidDependencyParams {
  packageName?: string;
  sourceDir?: string;
  manifestPath?: string;
  packageImportPath?: string;
  packageInstance?: string;
}
```

#### platforms.ios.project

Custom path to `.xcodeproj`.

#### platforms.ios.podspecPath

Custom path to `.podspec` file to use when auto-linking. Example: `node_modules/react-native-module/ios/module.podspec`.

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

#### platforms.android.sourceDir

A relative path to a folder with Android project (Gradle root project), e.g. `./path/to/custom-android`. By default, CLI searches for `./android` as source dir.

#### platforms.android.packageName

Custom package name, unless the default one present under `AndroidManifest.xml` is wrong.

#### platforms.android.manifestPath

Path to a custom `AndroidManifest.xml`

#### platforms.android.packageImportPath

Custom package import. For example: `import com.acme.AwesomePackage;`.

#### platforms.android.packageInstance

Custom syntax to instantiate a package. By default, it's a `new AwesomePackage()`. It can be useful when your package requires additional arguments while initializing.

For settings applicable on other platforms, please consult their respective documentation.

## Migrating from `rnpm`

Support for `rnpm` has been removed with the 4.x release of the CLI. If your project or library still uses `rnpm` for altering the behaviour of the CLI, please check [documentation of the older CLI release](https://github.com/react-native-community/cli/blob/3.x/docs/dependencies.md#migrating-from-rnpm-configuration) for steps on how to migrate.
