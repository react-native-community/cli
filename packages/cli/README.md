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
- [`start`](#start)
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

Usage:

```sh
react-native link [packageName]
```

Link native dependency or all native dependencies if no `packageName` passed.

#### Options

#### `--platforms [list]`

Pass comma-separated list of platforms to scope `link` to.

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

### `start`

Usage:

```
react-native start [option]
```

Starts the server that communicates with connected devices

#### Options

#### `--port [number]`

Specify port to listen on

#### `--watchFolders [list]`

Specify any additional folders to be added to the watch list

#### `--assetExts [list]`

Specify any additional asset extensions to be used by the packager

#### `--sourceExts [list]`

Specify any additional source extensions to be used by the packager

#### `--platforms [list]`

Specify any additional platforms to be used by the packager

#### `--providesModuleNodeModules [list]`

Specify any npm packages that import dependencies with providesModule

#### `--max-workers [number]`

Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine

#### `--skipflow`

Disable flow checks

#### `--nonPersistent`

Disable file watcher

#### `--transformer [string]`

Specify a custom transformer to be used

#### `--reset-cache, --resetCache`

Removes cached files

#### `--custom-log-reporter-path, --customLogReporterPath [string]`

Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter

#### `--verbose`

Enables logging

#### `--https`

Enables https connections to the server

#### `--key [path]`

Path to custom SSL key

#### `--cert [path]`

Path to custom SSL cert

#### `--config [string]`

Path to the CLI configuration file

### `uninstall`

Usage:

```sh
react-native uninstall <packageName>
```

Unlinks single package native dependencies and then uninstalls it from `package.json`. If `uninstall` detects `yarn.lock` in your project, it will use Yarn as package manager. Otherwise `npm` will be used.

### `unlink`

Usage:

```
react-native unlink <packageName>
```

Unlink native dependency linked with the `link` command.

### `upgrade`

Usage:

```sh
react-native upgrade [npm-version]
```

Upgrade your app's template files to the specified or latest npm version using [rn-diff-purge](https://github.com/react-native-community/rn-diff-purge) project. Only valid semver versions are allowed.

Using this command is a recommended way of upgrading relatively simple React Native apps with not too many native libraries linked. The more iOS and Android build files are modified, the higher chance for a conflicts. The command will guide you on how to continue upgrade process manually in case of failure.

_Note: If you'd like to upgrade using this method from React Native version lower than 0.59.0, you may use a standalone version of this CLI: `npx @react-native-community/cli upgrade`._
