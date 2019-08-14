# Commands

React Native CLI comes with following commands:

- [`bundle`](#bundle)
- [`config`](#config)
- [`init`](#init)
- [`info`](#info)
- [`install`](#install)
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

### `bundle`

Usage:

```sh
react-native bundle <flag>
```

Builds the JavaScript bundle for offline use.

#### `--entry-file <path>`

Path to the root JS file, either absolute or relative to JS root.

#### `--platform [string]`

> default: ios

Either "ios" or "android".

#### `--transformer [string]`

Specify a custom transformer to be used.

#### `--dev [boolean]`

> default: true

If false, warnings are disabled and the bundle is minified.

#### `--minify [boolean]`

Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.

#### `--bundle-output <string>`

File name where to store the resulting bundle, ex. `/tmp/groups.bundle`.

#### `--bundle-encoding [string]`

> default: utf8

Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer).

#### `--max-workers [number]`

Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine.

#### `--sourcemap-output [string]`

File name where to store the sourcemap file for resulting bundle, ex. `/tmp/groups.map`.

#### `--sourcemap-sources-root [string]`

Path to make sourcemaps sources entries relative to, ex. `/root/dir`.

#### `--sourcemap-use-absolute-path`

> default: false

Report SourceMapURL using its full path.

#### `--assets-dest [string]`

Directory name where to store assets referenced in the bundle.

#### `--reset-cache`

> default: false

Removes cached files.

#### `--read-global-cache`

> default: false

Try to fetch transformed JS code from the global cache, if configured.

#### `--config [string]`

Path to the CLI configuration file.

### `config`

Usage:

```sh
react-native config
```

Output project and dependencies configuration in JSON format to stdout. Used by [autolinking](./autolinking.md).

### `init`

> Available since 0.60.0

> **IMPORTANT**: Please note that this command is not available through `react-native-cli`, hence you need to either invoke it directly from `@react-native-community/cli` or `react-native` package which proxies binary to this CLI since 0.60.0, so it's possible to use it with e.g. `npx`.

Usage (with `npx`):

```sh
npx react-native init <projectName> [options]
```

Initialize a new React Native project named <projectName> in a directory of the same name. You can find out more use cases in [init docs](./init.md).

#### Options

#### `--version [string]`

Uses a valid semver version of React Native as a template.

#### `--directory [string]`

Uses a custom directory instead of `<projectName>`.

#### `--template [string]`

Uses a custom template. Accepts following template sources:

- an npm package name
- an absolute path to a local directory
- an absolute path to a tarball created using `npm pack`

Example:

```sh
npx react-native init MyApp --template react-native-custom-template
npx react-native init MyApp --template typescript
npx react-native init MyApp --template file:///Users/name/template-path
npx react-native init MyApp --template file:///Users/name/template-name-1.0.0.tgz
```

A template is any directory or npm package that contains a `template.config.js` file in the root with following of the following type:

```ts
type Template = {
  // Placeholder used to rename and replace in files
  // package.json, index.json, android/, ios/
  placeholderName: string;
  // Directory with template
  templateDir: string;
  // Path to script, which will be executed after init
  postInitScript?: string;
};
```

Example `template.config.js`:

```js
module.exports = {
  placeholderName: 'ProjectName',
  templateDir: './template',
  postInitScript: './script.js',
};
```

#### `--npm`

Force use of npm during initialization

### `info`

Usage:

```sh
react-native info
```

Get relevant version info about OS, toolchain and libraries. Useful when sending bug reports.

### `install`

Usage:

```sh
react-native install <packageName>
```

Installs single package from npm and then links native dependencies. If `install` detects `yarn.lock` in your project, it will use Yarn as package manager. Otherwise `npm` will be used.

### `link`

> Will be replaced by [autolinking](./autolinking.md) soon.

Usage:

```sh
react-native link [packageName]
```

Links assets and optionally native modules.

#### Options

#### `--all`

Link all native modules and assets.

#### `--platforms [list]`

Pass comma-separated list of platforms to scope `link` to.

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

#### `--root [string]`

Override the root directory for the Android build (which contains the android directory)'.

#### `--variant [string]`

> default: 'debug'

Specify your app's build variant.

#### `--appFolder [string]`

> default: 'app'

Specify a different application folder name for the Android source. If not, we assume is "app".

#### `--appId [string]`

Specify an `applicationId` to launch after build.

#### `--appIdSuffix [string]`

Specify an `applicationIdSuffix` to launch after build.

#### `--main-activity [string]`

> default: 'MainActivity'

Name of the activity to start.

#### `--deviceId [string]`

builds your app and starts it on a specific device/simulator with the given device id (listed by running "adb devices" on the command line).

#### `--no-packager`

Do not launch packager while building.

#### `--port [number]`

> default: process.env.RCT_METRO_PORT || 8081

#### `--terminal [string]`

> default: process.env.REACT_TERMINAL || process.env.TERM_PROGRAM

Launches the Metro Bundler in a new window using the specified terminal path.

#### `--tasks [list]`

> default: 'installDebug'

Run custom gradle tasks. If this argument is provided, then `--variant` option is ignored.
Example: `yarn react-native run-android --tasks clean,installDebug`.

#### `--no-jetifier`

> default: false

Do not run [jetifier](https://www.npmjs.com/package/jetifier) – the AndroidX transition tool. By default it runs before Gradle to ease working with libraries that don't support AndroidX yet.

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

#### `--projectRoot [path]`

Path to a custom project root

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

> Will be replaced by [autolinking](./autolinking.md) soon.

Usage:

```
react-native unlink <packageName> [options]
```

Unlink native dependency linked with the `link` command.

#### Options

#### `--platforms [list]`

Scope unlinking to specified platforms

### `upgrade`

Usage:

```sh
react-native upgrade [npm-version]
```

Upgrade your app's template files to the specified or latest npm version using [rn-diff-purge](https://github.com/react-native-community/rn-diff-purge) project. Only valid semver versions are allowed.

Using this command is a recommended way of upgrading relatively simple React Native apps with not too many native libraries linked. The more iOS and Android build files are modified, the higher chance for a conflicts. The command will guide you on how to continue upgrade process manually in case of failure.

_Note: If you'd like to upgrade using this method from React Native version lower than 0.59.0, you may use a standalone version of this CLI: `npx @react-native-community/cli upgrade`._
