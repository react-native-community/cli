# Autolinking

React Native libraries often come with platform-specific (native) code. Autolinking is a mechanism that allows your project to discover and use this code.

Add a library using your favorite package manager and run the build:

```sh
# install
yarn add react-native-webview
cd ios && pod install && cd .. # CocoaPods on iOS needs this extra step
# run
yarn react-native run-ios
yarn react-native run-android
```

That's it. No more editing build config files to use native code.

> Autolinking is a replacement for [`react-native link`](./linking.md). If you have been using React Native before version 0.60, please `unlink` native dependencies if you have any from a previous install.

## How does it work

Each platform defines its own [`platforms`](./platforms.md) configuration. It instructs the CLI on how to find information about native dependencies. This information is exposed through the [`config`](./commands.md#config) command in a JSON format. It's then used by the scripts run by the platform's build tools. Each script applies the logic to link native dependencies specific to its platform.

## Platform iOS

The `Podfile` gets the package metadata from `react-native config` and:

1. Adds dependencies via CocoaPods dev pods (using files from a local path).
1. Adds build phase scripts to the App project’s build phase. (see examples below)

This means that all libraries need to ship a Podspec in the root of their folder to work seamlessly. This references the native code that your library depends on, and notes any of its other native dependencies.

The implementation ensures that a library is imported only once. If you need to have a custom `pod` directive then include it above the `use_native_modules!` function.

See the implementation of [native_modules.rb](https://github.com/react-native-community/cli/blob/master/packages/platform-ios/native_modules.rb).

### Custom root (monorepos)

The project root is where `node_modules` with `react-native` is. Autolinking script assume your project root to be `".."`, relative to `ios` directory. If you're in a project with custom structure, like this:

```
root/
  node_modules
  example/
    ios/
```

you'll need to set a custom root. Pass it as an argument to `use_native_modules!`:

```rb
# example/ios/Podfile
use_native_modules!("../..")
```

## Platform Android

1. At build time, before the build script is run:
   1. A first Gradle plugin (in `settings.gradle`) runs `applyNativeModulesSettingsGradle` method. It uses the package metadata from `react-native config` to add Android projects.
   1. A second Gradle plugin (in `app/build.gradle`) runs `applyNativeModulesAppBuildGradle` method. It creates a list of React Native packages to include in the generated `/android/build/generated/rn/src/main/java/com/facebook/react/PackageList.java` file.
1. At runtime, the list of React Native packages, generated in step 1.2, is passed to React Native host.

See the implementation of [native_modules.gradle](https://github.com/react-native-community/cli/blob/master/packages/platform-android/native_modules.gradle).

### Custom root (monorepos)

The project root is where `node_modules` with `react-native` is. Autolinking scripts assume your project root to be `".."`, relative to `android` directory. If you're in a project with custom structure, like this:

```
root/
  node_modules
  example/
    android/
```

you'll need to set a custom root. Pass it as a second argument to `applyNativeModulesSettingsGradle` and `applyNativeModulesAppBuildGradle` methods:

```groovy
// example/android/settings.gradle
applyNativeModulesSettingsGradle(settings, "../..")
```

```groovy
// example/android/app/build.gradle
applyNativeModulesAppBuildGradle(project, "../..")
```

## What do I need to have in my package to make it work?

You’re already using Gradle, so Android support will work by default.

On the iOS side, you will need to ensure you have a Podspec to the root of your repo. The `react-native-webview` Podspec is a good example of a [`package.json`](https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec)-driven Podspec. Note that CocoaPods does not support having `/`s in the name of a dependency, so if you are using scoped packages - you may need to change the name for the Podspec.

## How can I customize how autolinking works for my package?

A library can add a `react-native.config.js` configuration file, which will customize the defaults.

## How can I disable autolinking for unsupported library?

During the transition period some packages may not support autolinking on certain platforms. To disable autolinking for a package, update your `react-native.config.js`'s `dependencies` entry to look like this:

```js
// react-native.config.js
module.exports = {
  dependencies: {
    'some-unsupported-package': {
      platforms: {
        android: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
  },
};
```

## How can I autolink a local library?

We can leverage CLI configuration to make it "see" React Native libraries that are not part of our 3rd party dependencies. To do so, update your `react-native.config.js`'s `dependencies` entry to look like this:

```js
// react-native.config.js
module.exports = {
  dependencies: {
    'local-rn-library': {
      root: '/root/libraries',
    },
  },
};
```
