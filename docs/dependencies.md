# Dependency

A dependency is a JavaScript package that is listed under dependencies present in the project's `package.json` and contains native, platform-specific code.

A dependency can define the following `react-native.config.js` at the root:

```js
module.exports = {
  dependency: {
    platforms: {
      // iOS specific properties go here
      ios: {},
      // Android specific properties go here
      android: {},
    },
  },
};
```

## Dependency interface

The following type describes the configuration of a dependency that can be set under `dependency` key inside `react-native.config.js`.

```ts
type DependencyConfig = {
  platforms: {
    android?: AndroidDependencyParams;
    ios?: IOSDependencyParams;

    // There can be additional platforms, such as `windows` present
    [key: string]: any;
  };
};
```

### platforms

A map of specific settings that can be set per platform. The exact shape is always defined by the package that provides given platform.

In most cases, as a library author, you should not need to define any of these.

The following settings are available on iOS and Android:

```ts
type IOSDependencyConfig = {
  scriptPhases?: Array<IOSScriptPhase>;
  configurations?: string[];
};

type AndroidDependencyParams = {
  sourceDir?: string;
  manifestPath?: string;
  packageName?: string;
  dependencyConfiguration?: string;
  packageImportPath?: string;
  packageInstance?: string;
  buildTypes?: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  androidMkPath?: string | null;
};
```

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

#### platforms.android.packageName

Custom package name to override one from `AndroidManifest.xml`

#### platforms.android.packageImportPath

Custom package import. For example: `import com.acme.AwesomePackage;`.

#### platforms.android.packageInstance

Custom syntax to instantiate a package. By default, it's a `new AwesomePackage()`. It can be useful when your package requires additional arguments while initializing.

For settings applicable on other platforms, please consult their respective documentation.

#### platforms.android.buildTypes

An array of build variants or flavors which will include the dependency. If the array is empty, your dependency will be included in all build types. If you're working on a helper library that should only be included in development, such as a replacement for the React Native development menu, you should set this to `['debug']` to avoid shipping the library in a release build. For more details, see [`build variants`](https://developer.android.com/studio/build/build-variants#dependencies).

#### platforms.android.dependencyConfiguration

A string that defines which method other than `implementation` do you want to use
for autolinking inside `build.gradle` i.e: `'embed project(path: ":$dependencyName", configuration: "default")',` - `"dependencyName` will be replaced by the actual package's name. You can achieve the same result by directly defining this key per `dependency` _(without placeholder)_ and it will have higher priority than this option.

#### platforms.android.libraryName

> Note: Only applicable when new architecture is turned on.

A string indicating your custom library name. By default it's taken from the `libraryName` variable in your library's `build.gradle`.

#### platforms.android.componentDescriptors

> Note: Only applicable when new architecture is turned on.

An array of custom component descriptor strings. By default they're generated based on `codegenNativeComponent` calls.

#### platforms.android.androidMkPath

> Note: Only applicable when new architecture is turned on.

A relative path to a custom _Android.mk_ file not registered by codegen. Relative to `sourceDir`.
