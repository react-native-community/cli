# @react-native-community/cli-plugin-metro

This package is part of the [React Native CLI](../../README.md).
It contains commands for managing the Metro bundler.

## Installation

```sh
yarn add @react-native-community/cli-plugin-metro
```

## Commands

### `start`

Usage:

```sh
react-native start [option]
```

Starts the server that communicates with connected devices

#### Options

#### `--port <number>`

Specify port to listen on

#### `--projectRoot <path>`

Path to a custom project root

#### `--watchFolders <list>`

Specify any additional folders to be added to the watch list

#### `--assetPlugins <list>`

Specify any additional asset plugins to be used by the packager by full filepath

#### `--sourceExts <list>`

Specify any additional source extensions to be used by the packager

#### `--max-workers <number>`

Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine

#### `--transformer <string>`

Specify a custom transformer to be used

#### `--reset-cache, --resetCache`

Removes cached files

#### `--custom-log-reporter-path, --customLogReporterPath <string>`

Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter

#### `--https`

Enables https connections to the server

#### `--key <path>`

Path to custom SSL key

#### `--cert <path>`

Path to custom SSL cert

#### `--config <string>`

Path to the CLI configuration file

#### `--no-interactive`

Disables interactive mode

### `bundle`

Usage:

```sh
react-native bundle <flag>
```

Builds the JavaScript bundle for offline use.

#### `--entry-file <path>`

Path to the root JS file, either absolute or relative to JS root.

#### `--platform <string>`

> default: ios

Either "ios" or "android".

#### `--transformer <string>`

Specify a custom transformer to be used.

#### `--dev [boolean]`

> default: true

If false, warnings are disabled and the bundle is minified.

#### `--minify [boolean]`

Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.

#### `--bundle-output <string>`

File name where to store the resulting bundle, ex. `/tmp/groups.bundle`.

If you are planning on building a debug APK, that will run without the packager, by invoking `./gradlew assembleDebug` you can simply set `bundleInDebug: true` in your app/build.gradle file, inside the `project.ext.react` map.

<details>
Alternatively if you want to run <code>react-native bundle</code> manually and then create the APK with <code>./gradlew assembleDebug</code> you have to make sure to put the bundle into the right directory and give it the right name, so that gradle can find it.

For react-native versions 0.57 and above the bundle output path should be:
<code>android/app/build/generated/assets/react/debug/index.android.js</code>

To find out the correct path for previous react-native versions, take a look at the <code>react.gradle</code> file here: <https://github.com/facebook/react-native/blob/0.57-stable/react.gradle> or inside your <code>node_modules/react-native</code> directory.

The expected path for the js bundle can be found on the line that starts with <code>jsBundleDir = </code>.

</details>

#### `--bundle-encoding <string>`

> default: utf8

Encoding the bundle should be written in (<https://nodejs.org/api/buffer.html#buffer_buffer>).

#### `--max-workers <number>`

Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine.

#### `--sourcemap-output <string>`

File name where to store the sourcemap file for resulting bundle, ex. `/tmp/groups.map`.

#### `--sourcemap-sources-root <string>`

Path to make sourcemap sources entries relative to, ex. `/root/dir`.

#### `--sourcemap-use-absolute-path`

> default: false

Report SourceMapURL using its full path.

#### `--assets-dest <string>`

Directory name where to store assets referenced in the bundle.

If you are planning on building a debug APK that will run without the packager, see ([--bundle-output](https://github.com/react-native-community/cli/blob/master/docs/commands.md#--bundle-output-string))

<details>
  Alternatively if you want to run <code>react-native bundle</code> manually and then create the APK with <code>./gradlew assembleDebug</code> you have to make sure to put the assets into the right directory, so that gradle can find them.

For react-native versions 0.57 and above the <code>--assets-dest</code> path should be:
<code>android/app/build/generated/res/react/debug</code>

The expected path for the assets can be found in the react.gradle file on the line that starts with <code>resourcesDir =</code>

</details>

#### `--reset-cache`

> default: false

Removes cached files.

#### `--read-global-cache`

> default: false

Try to fetch transformed JS code from the global cache, if configured.

#### `--config <string>`

Path to the CLI configuration file.

### `ram-bundle`

Usage:

```sh
react-native ram-bundle [options]
```

Builds JavaScript as a "Random Access Module" bundle for offline use.

#### Options

Accepts all of [bundle commands](#bundle) and following:

#### `--indexed-ram-bundle`

Force the "Indexed RAM" bundle file format, even when building for Android.
