# @react-native-community/cli-platform-ios

This package is part of the [React Native CLI](../../README.md). It contains commands for managing iOS part of React Native app.

## Installation

```sh
yarn add @react-native-community/cli-platform-ios
```

## Commands

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

Example: this will launch your project directly onto the iPhone 14 simulator:

```sh
react-native run-ios --simulator "iPhone 14"
```

#### `--configuration <string>`

[Deprecated] Explicitly set the scheme configuration to use default: 'Debug'.

#### `--mode <string>`

Explicitly set the scheme configuration to use. This option is case sensitive.

Example:

```sh
react-native run-ios --mode "Release"
```

#### `--scheme <string>`

Explicitly set Xcode scheme to use.

#### `--device [string]`

Explicitly set device to use by name. The value is not required if you have a single device connected.

#### `--destination <string>`

Explicitly extend distination e.g. "arch=x86_64"

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

Example: this will launch your project directly onto the iPhone 14 simulator:

```sh
react-native build-ios --simulator "iPhone 14"
```

#### `--configuration <string>`

[Deprecated] Explicitly set the scheme configuration to use default: 'Debug'.

#### `--mode <string>`

Explicitly set the scheme configuration to use. This option is case sensitive.

Example:

```sh
react-native build-ios --mode "Release"
```

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

### log-ios

### `log-ios`

Usage:

```sh
react-native log-ios
```

Starts iOS device syslog tail.

#### Options

#### `--interactive`

Explicitly select simulator to tail logs from. By default it will tail logs from the first booted and available simulator.

## License

Everything inside this repository is [MIT licensed](./LICENSE).
