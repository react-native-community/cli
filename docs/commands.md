# Commands

React Native CLI comes with following commands:

- [`bundle`](#bundle)
- [`clean`](#clean)
- [`config`](#config)
- [`doctor`](#doctor)
- [`init`](#init)
- [`info`](#info)
- [`log-android`](#log-android)
- [`log-ios`](#log-ios)
- [`ram-bundle`](#ram-bundle)
- [`run-android`](#run-android)
- [`build-android`](#build-android)
- [`run-ios`](#run-ios)
- [`build-ios`](#build-ios)
- [`start`](#start)
- [`upgrade`](#upgrade)
- [`profile-hermes`](#profile-hermes)

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

### `clean`

Usage:

```sh
react-native clean
```

Cleans caches. Commonly used to ensure build failures are not due to stale cache. By default, it will prompt which caches to purge, with Watchman and Metro already checked. To omit interactive prompt (e.g. in scripts), please use `--include` flag.

#### Options

#### `--include <string>`

Comma-separated flag of caches to clear e.g. `npm,yarn`. If omitted, an interactive prompt will appear. Valid values include `android`, `cocoapods`, `metro`, `npm`, `watchman`, and `yarn`.

#### `--project-root <string>`

> default: current working directory

Root path to your React Native project. When not specified, defaults to current working directory.

#### `--verify-cache`

> default: false

Whether to verify the cache. Currently only applies to npm cache.

### `config`

Usage:

```sh
react-native config
```

Output project and dependencies configuration in JSON format to stdout. Used by [autolinking](./autolinking.md).

### `doctor`

Usage:

```sh
react-native doctor
```

[EXPERIMENTAL] Diagnose and fix common Node.js, iOS, Android & React Native issues.

### `init`

> Available since 0.60.0

> **IMPORTANT**: Please note that this command is not available through `react-native-cli`, hence you need to either invoke it directly from `@react-native-community/cli` or `react-native` package which proxies binary to this CLI since 0.60.0, so it's possible to use it with e.g. `npx`.

Usage (with `npx`):

```sh
npx react-native init <projectName> [options]
```

Initialize a new React Native project named <projectName> in a directory of the same name. You can find out more use cases in [init docs](./init.md).

#### Options

#### `--version <string>`

Shortcut for `--template react-native@version`.

#### `--directory <string>`

Uses a custom directory instead of `<projectName>`.

#### `--title <string>`

Uses a custom app title instead of `<projectName>`.

#### `--template <string>`

Uses a custom template. Accepts following template sources:

- an npm package name
- an absolute path to a local directory
- an absolute path to a tarball created using `npm pack`
- link to a GitHub repository (supports `username/repo` format)

Example:

```sh
npx react-native init MyApp --template react-native-custom-template
npx react-native init MyApp --template file:///Users/name/template-path
npx react-native init MyApp --template file:///Users/name/template-name-1.0.0.tgz
npx react-native init MyApp --template Esemesek/react-native-new-template
```

A template is any directory or npm package that contains a `template.config.js` file in the root with the following type:

```ts
type Template = {
  // Placeholder used to rename and replace in files
  // package.json, index.json, android/, ios/
  placeholderName: string;
  // Directory with template
  templateDir: string;
  // Path to script, which will be executed after init
  postInitScript?: string;
  // Placeholder used to rename app title inside values.xml and Info.plist
  titlePlaceholder?: string;
};
```

Example `template.config.js`:

```js
module.exports = {
  placeholderName: 'ProjectName',
  titlePlaceholder: 'Project Display Name',
  templateDir: './template',
  postInitScript: './script.js',
};
```

#### `--skip-install`

Skip dependencies installation

#### `--npm`

Force use of npm during initialization

#### `--package-name <string>`

Create project with custom package name for Android and bundle identifier for iOS. The correct package name should:
- contain at least two segments separated by dots, e.g. `com.example`
- contain only alphanumeric characters and dots
### `info`

Usage:

```sh
react-native info
```

Get relevant version info about OS, toolchain and libraries. Useful when sending bug reports.

### `log-android`

Usage:

```sh
react-native log-android
```

Starts [`logkitty`](https://github.com/zamotany/logkitty) displaying pretty Android logs.

### `log-ios`

Usage:

```sh
react-native log-ios
```

Starts iOS device syslog tail.

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

### `run-android`

Usage:

```sh
react-native run-android [options]
```

Builds your app and starts it on a connected Android emulator or device.

#### Options

#### `--root <string>`

> **DEPRECATED** – root is discovered automatically

Override the root directory for the Android build (which contains the android directory)'.

#### `--variant <string>`

> **DEPRECATED** – use "mode" instead

> default: 'debug'

Specify your app's build variant.

#### `--appFolder <string>`

> **DEPRECATED** – use "project.android.appName" in react-native.config.js

> default: 'app'

Specify a different application folder name for the Android source. If not, we assume is "app".

#### `--appId <string>`

Specify an `applicationId` to launch after build. If not specified, `package` from AndroidManifest.xml will be used.

#### `--appIdSuffix <string>`

Specify an `applicationIdSuffix` to launch after build.

#### `--main-activity <string>`

> default: 'MainActivity'

Name of the activity to start.

#### `--deviceId <string>`

builds your app and starts it on a specific device/simulator with the given device id (listed by running "adb devices" on the command line).

#### `--no-packager`

Do not launch packager while building.

#### `--port <number>`

> default: process.env.RCT_METRO_PORT || 8081

#### `--terminal <string>`

> default: process.env.REACT_TERMINAL || process.env.TERM_PROGRAM

Launches the Metro Bundler in a new window using the specified terminal path.

#### `--tasks <list>`

> default: 'installDebug'

Run custom gradle tasks. If this argument is provided, then `--variant` option is ignored.
Example: `yarn react-native run-android --tasks clean,installDebug`.

#### `--active-arch-only`

> default: false

Build native libraries only for the current device architecture for debug builds.

#### `--list-devices`

> default: false

List all available Android devices and simulators and let you choose one to run the app.

### `build-android`

Usage:

```sh
react-native build-android [options]
```

Builds Android app.

#### Options

#### `--mode <string>`

> default: debug

Mode to build the app. Either 'debug' (default) or 'release'.

#### `--extra-params <string>`

Custom params that will be passed to gradle build command.
Example:

```sh
react-native build-android --extra-params "-x lint -x test"
```

#### `--binary-path <path>`

Installs passed binary instead of building a fresh one. This command is not compatible with `--tasks`.

### `run-ios`

Usage:

```sh
react-native run-ios [options]
```

Builds your app and starts it on iOS simulator.


#### Options

#### `--simulator <simulator_name>`

> default: iPhone 14

Explicitly set the simulator to use. Optionally include iOS version between parenthesis at the end to match an exact version, e.g. `"iPhone 6 (10.0)"`.

Notes: If selected simulator does not exist, cli will try to run fallback simulators in following order:

- `iPhone 14`
- `iPhone 13`
- `iPhone 12`
- `iPhone 11`

Notes: `simulator_name` must be a valid iOS simulator name. If in doubt, open your AwesomeApp/ios/AwesomeApp.xcodeproj folder on XCode and unroll the dropdown menu containing the simulator list. The dropdown menu is situated on the right hand side of the play button (top left corner).

Example: this will launch your project directly onto the iPhone XS Max simulator:

```sh
react-native run-ios --simulator "iPhone XS Max"
```

#### `--configuration <string>`

[Deprecated] Explicitly set the scheme configuration to use default: 'Debug'.

#### `--scheme <string>`

Explicitly set Xcode scheme to use.

#### `--device [string]`

Explicitly set device to use by name. The value is not required if you have a single device connected.

#### `--udid <string>`

Explicitly set device to use by udid.

#### `--no-packager`

Do not launch packager while building.

#### `--verbose`

Do not use `xcbeautify` or `xcpretty` even if installed.

#### `--port <number>`

Runs packager on specified port.

Default: `process.env.RCT_METRO_PORT || 8081`

#### `--xcconfig <string>`

Explicitly set `xcconfig` to use in build.

#### `--buildFolder <string>`

Location for iOS build artifacts. Corresponds to Xcode's `-derivedDataPath`.

#### `--extra-params <string>`

Custom params that will be passed to `xcodebuild` command.
Example:

```sh
react-native run-ios --extra-params "-jobs 4"
```

### `build-ios`

Usage:

```sh
react-native build-ios [options]
```

Builds IOS app.

#### Options
#### `--simulator <simulator_name>`

> default: iPhone 14

Explicitly set the simulator to use. Optionally include iOS version between parenthesis at the end to match an exact version, e.g. `"iPhone 6 (10.0)"`.

Notes: If selected simulator does not exist, cli will try to run fallback simulators in following order:

- `iPhone 14`
- `iPhone 13`
- `iPhone 12`
- `iPhone 11`

Notes: `simulator_name` must be a valid iOS simulator name. If in doubt, open your AwesomeApp/ios/AwesomeApp.xcodeproj folder on XCode and unroll the dropdown menu containing the simulator list. The dropdown menu is situated on the right hand side of the play button (top left corner).

Example: this will launch your project directly onto the iPhone XS Max simulator:

```sh
react-native run-ios --simulator "iPhone XS Max"
```

#### `--configuration <string>`

[Deprecated] Explicitly set the scheme configuration to use default: 'Debug'.

#### `--scheme <string>`

Explicitly set Xcode scheme to use.

#### `--device [string]`

Explicitly set device to use by name. The value is not required if you have a single device connected.

#### `--udid <string>`

Explicitly set device to use by udid.

#### `--no-packager`

Do not launch packager while building.

#### `--verbose`

Do not use `xcbeautify` or `xcpretty` even if installed.

#### `--port <number>`

Runs packager on specified port.

Default: `process.env.RCT_METRO_PORT || 8081`

#### `--xcconfig <string>`

Explicitly pass `xcconfig` options from the command line.

#### `--buildFolder <string>`

Location for iOS build artifacts. Corresponds to Xcode's `-derivedDataPath`.

#### `--binary-path <path>`

Installs passed binary instead of building a fresh one.

#### `--list-devices`

> default: false

List all available iOS devices and simulators and let you choose one to run the app.

#### `--extra-params <string>`

Custom params that will be passed to `xcodebuild` command.
Example:

```sh
react-native build-ios --extra-params "-jobs 4"
```

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

### `upgrade`

Usage:

```sh
react-native upgrade [npm-version]
```

Upgrade your app's template files to the specified or latest npm version using [rn-diff-purge](https://github.com/react-native-community/rn-diff-purge) project. Only valid semver versions are allowed.

Using this command is a recommended way of upgrading relatively simple React Native apps with not too many native libraries linked. The more iOS and Android build files are modified, the higher chance for a conflicts. The command will guide you on how to continue upgrade process manually in case of failure.

_Note: If you'd like to upgrade using this method from React Native version lower than 0.59.0, you may use a standalone version of this CLI: `npx @react-native-community/cli upgrade`._

### `profile-hermes`

Usage:

```sh
react-native profile-hermes [destinationDir] <flag>
```

Pull and convert a Hermes tracing profile to Chrome tracing profile, then store it in the directory <destinationDir> of the local machine.

- `destinationDir` is optional, if provided, pull the file to that directory
  > default: pull to the current React Native app root directory

#### Options

#### `--filename <string>`

File name of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile.

> default: pull the latest file

#### `--raw`

Pulls the original Hermes tracing profile without any transformation

#### `--sourcemap-path <string>`

The local path to your source map file if you generated it manually, ex. `/tmp/sourcemap.json`

#### `--generate-sourcemap`

Generate the JS bundle and source map in `os.tmpdir()`

#### `--port <number>`

The running metro server port number

> default: 8081

#### `--appId <string>`

Specify an `applicationId` to launch after build. If not specified, `package` from AndroidManifest.xml will be used.

#### `--appIdSuffix <string>`

Specify an `applicationIdSuffix` to launch after build.

### Notes on source map

This step is recommended in order for the source map to be generated:

If you are planning on building a debug APK, that will run without the packager, by invoking `./gradlew assembleDebug` you can simply set `bundleInDebug: true` in your app/build.gradle file, inside the `project.ext.react` map.
