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
npx react-native run-android [options]
```

Builds your app and starts it on a connected Android emulator or device.

#### Options

#### `--appId <string>`

Specify an `applicationId` to launch after build. If not specified, `package` from AndroidManifest.xml will be used.

#### `--appIdSuffix <string>`

Specify an `applicationIdSuffix` to launch after build.

#### `--main-activity <string>`

> default: 'MainActivity'

Name of the activity to start.

#### `--device <string>`

Explicitly set the device to use by name. The value is not required if you have a single device connected.

#### `--deviceId <string>`

> **DEPRECATED** - use `--device <string>` instead

Builds your app and starts it on a specific device with the given device id (listed by running "adb devices" on the command line).

#### `--no-packager`

Do not launch packager while building.

#### `--port <number>`

> default: process.env.RCT_METRO_PORT || 8081

#### `--terminal <string>`

> default: process.env.REACT_TERMINAL || process.env.TERM_PROGRAM

Launches the Metro Bundler in a new window using the specified terminal path.

#### `--tasks <list>`

> default: 'installDebug'

Run custom gradle tasks. If this argument is provided, then `--mode` option is ignored.
Example: `yarn react-native run-android --tasks clean,installDebug`.

#### `--active-arch-only`

> default: false

Build native libraries only for the current device architecture for debug builds.

#### `--list-devices`

> default: false

List all available Android devices and simulators and let you choose one to run the app.

#### `--interactive`, `-i`

Manually select a task and device/simulator you want to run your app on.

> [!WARNING]  
> This flag is running `./gradlew tasks` under the hood, which might take some time for more complex apps. If that affects your project, consider using `--mode` and `--deviceId` flags instead.

### `build-android`

Usage:

```sh
npx react-native build-android [options]
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
npx react-native build-android --extra-params "-x lint -x test"
```

#### `--binary-path <path>`

Installs passed binary instead of building a fresh one. This command is not compatible with `--tasks`.

#### `--user` <number | string>

Id of the User Profile you want to install the app on.

### `log-android`

Usage:

```sh
npx react-native log-android
```

Starts [`logkitty`](https://github.com/zamotany/logkitty) displaying pretty Android logs.
