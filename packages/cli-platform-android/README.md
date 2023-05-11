# @react-native-community/cli-platform-android

This package is part of the [React Native CLI](../../README.md). It contains commands for managing the Android part of React Native app.

## Installation

```sh
yarn add @react-native-community/cli-platform-android
```

## Commands

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

#### `--user` <number | string>

Id of the User Profile you want to install the app on.
### `log-android`

Usage:

```sh
react-native log-android
```

Starts [`logkitty`](https://github.com/zamotany/logkitty) displaying pretty Android logs.
