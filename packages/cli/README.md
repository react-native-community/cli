# React Native CLI

Command line tools to interact with React Native projects.

## Commands

CLI comes with a set of commands and flags you can pass to them.

- [`bundle`](#bundle)
- [`dependencies`](#dependencies)
- [`info`](#info)
- [`install`](#install)
- [`library`](#library)
- [`link`](#link)
- [`log-android`](#log-android)
- [`log-ios`](#log-ios)
- [`ram-bundle`](#ram-bundle)
- [`run-android`](#run-android)
- [`run-ios`](#run-ios)
- [`server`](#server)
- [`uninstall`](#uninstall)
- [`unlink`](#unlink)
- [`upgrade`](#upgrade)

_Note: This document is still under development and doesn't represent the full API area._

### `bundle`

### `dependencies`

### `info`

### `install`

Usage:

```sh
react-native install <packageName>
```

Installs single package from npm and then links native dependencies. If `install` detects `yarn.lock` in your project, it will use Yarn as package manager. Otherwise `npm` will be used.

### `library`

### `link`

### `log-android`

### `log-ios`

### `ram-bundle`

### `run-android`

### `run-ios`

Usage:

```sh
react-native run-ios [options]
```

Builds your app and starts it on iOS simulator.

#### Options

#### `--simulator [simulator_name]`

Explicitly set the simulator to use. Optionally include iOS version between parenthesis at the end to match an exact version, e.g. `"iPhone 6 (10.0)"`.

Default: `"iPhone X"`

Notes: `simulator_name` must be a valid iOS simulator name. If in doubt, open your AwesomeApp/ios/AwesomeApp.xcodeproj folder on XCode and unroll the dropdown menu containing the simulator list. The dropdown menu is situated on the right hand side of the play button (top left corner).

Example: this will launch your projet directly onto the iPhone XS Max simulator:

```sh
react-native run-ios --simulator "iPhone XS Max"
```

#### `--configuration [string]`

Explicitly set the scheme configuration to use default: 'Debug'.

#### `--scheme [string]`

Explicitly set Xcode scheme to use.

#### `--project-path [string]`

Path relative to project root where the Xcode project (.xcodeproj) lives. default: 'ios'.

#### `--device [string]`

Explicitly set device to use by name. The value is not required if you have a single device connected.

#### `--udid [string]`

Explicitly set device to use by udid.

#### `--no-packager`

Do not launch packager while building.

#### `--verbose`

Do not use `xcpretty` even if installed.

#### `--port [number]`

Runs packager on specified port

Default: `process.env.RCT_METRO_PORT || 8081`

### `server`

### `uninstall`

Usage:

```sh
react-native uninstall <packageName>
```

Unlinks single package native dependencies and then uninstalls it from `package.json`. If `uninstall` detects `yarn.lock` in your project, it will use Yarn as package manager. Otherwise `npm` will be used.

### `unlink`

### `upgrade`
