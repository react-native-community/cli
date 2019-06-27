# Autolinking

Autolinking is a mechanism built into CLI that allows adding a dependency with native components for React Native to be as simple as:

```sh
yarn add react-native-webview
```

> Autolinking is a replacement for [`react-native link`](./linking.md) that brings new features (such as ability to easily integrate native dependencies on iOS) and fixes some of the long-standing issues.

## How does it work

React Native CLI provides a [`config`](./commands.md#config) command which grabs all of the configuration for React Native packages installed in the project (by scanning dependencies in `package.json`) and outputs it in JSON format.

This information is then used by the projects advertised as platforms (with `react-native` being a default project supporting both iOS and Android platforms) that implement their autolinking behavior.

This design ensures consistent settings for any platform and allows `react-native config` to update the implementation of how to source this information (be it specified filenames, entries in the module’s package.json, etc).

## Platform iOS

The `Podfile` gets the package metadata from `react-native config` and:

1. Adds dependencies via CocoaPods dev pods (using files from a local path).
1. Adds build phase scripts to the App project’s build phase. (see examples below)

This means that all libraries need to ship a Podspec in the root of their folder to work seamlessly. This references the native code that your library depends on, and notes any of its other native dependencies.

The implementation ensures that a library is imported only once, so if you need to have a custom `pod` directive then including it above the function `use_native_modules!`.

See implementation of [native_modules.rb](https://github.com/react-native-community/cli/blob/master/packages/platform-ios/native_modules.rb).

_Notes_: Auto-linking assumes your Podfile is in a sub-folder from your `package.json` - if this is not the case, use the first parameter to tell the linker where to find the `package.json` e.g. `use_native_modules!("../../")`.

## Platform Android

1. At build time, before the build script is run, a first gradle plugin (`settings.gradle`) is ran that takes the package metadata from `react-native config` to dynamically include Android library projects into the build.
1. A second plugin then adds those dependencies to the app project and generates a manifest of React Native packages to include in the fully generated file `/android/build/generated/rn/src/main/java/com/facebook/react/PackageList.java`.
1. Finally, at runtime (on startup) the list of React Native packages, generated in step 2, is used to instruct the React Native runtime of what native modules are available.

See implementation of [native_modules.gradle](https://github.com/react-native-community/cli/blob/master/packages/platform-android/native_modules.gradle).

## What do I need to have in my package to make it work?

You’re already using Gradle, so Android support will work by default.

On the iOS side, you will need to ensure you have a Podspec to the root of your repo. The `react-native-webview` Podspec is a good example of a [`package.json`](https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec)-driven Podspec. Note that CocoaPods does not support having `/`s in the name of a dependency, so if you are using scoped packages - you may need to change the name for the Podspec.

## How can I customize how autolinking works for my package?

A library can add a `react-native.config.js` configuration file, which will customize the defaults.

## How do I disable autolinking for unsupported package?

It happens, that during transition period or due to convoluted setup some packages don't support autolinking on certain platforms. To disable autolinking from running for a certain package, update your `react-native.config.js`'s `dependencies` entry to look like this:

```js
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
