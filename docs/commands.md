# Commands

React Native CLI comes with following commands:

- [`bundle`](https://github.com/facebook/react-native/tree/main/packages/community-cli-plugin#bundle)
- [`clean`](/packages/cli-clean/README.md#clean)
- [`config`](/packages/cli-config/README.md#config)
- [`doctor`](/packages/cli-doctor/README.md#doctor)
- [`link-assets`](/packages/cli-link-assets/README.md#link-assets)
- [`init`](#init)
- [`info`](/packages/cli-doctor/README.md#info)
- [`log-android`](/packages/cli-platform-android/README.md#log-android)
- [`log-ios`](/packages/cli-platform-ios/README.md#log-ios)
- [`ram-bundle`](https://github.com/facebook/react-native/tree/main/packages/community-cli-plugin#ram-bundle)
- [`run-android`](/packages/cli-platform-android/README.md#run-android)
- [`build-android`](/packages/cli-platform-android/README.md#build-android)
- [`run-ios`](/packages/cli-platform-ios/README.md#run-ios)
- [`build-ios`](/packages/cli-platform-ios/README.md#build-ios)
- [`start`](https://github.com/facebook/react-native/tree/main/packages/community-cli-plugin#start)
- [`upgrade`](#upgrade)
- [`profile-hermes`](/packages/cli-hermes/README.md#profile-hermes)

### `init`

> Available since 0.60.0

> **IMPORTANT**: Please note that this command is not available through `react-native-cli`, hence you need to either invoke it directly from `@react-native-community/cli` or `react-native` package which proxies binary to this CLI since 0.60.0, so it's possible to use it with e.g. `npx`.

Usage (with `npx`):

```sh
npx react-native@latest init <projectName> [options]
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
npx react-native@latest init MyApp --template react-native-custom-template
npx react-native@latest init MyApp --template file:///Users/name/template-path
npx react-native@latest init MyApp --template file:///Users/name/template-name-1.0.0.tgz
npx react-native@latest init MyApp --template Esemesek/react-native-new-template
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

#### `--install-pods [boolean]`

Determine if CocoaPods should be installed when initializing a project. If set to `true` it will install pods, if set to `false`, it will skip the step entirely. If not used, prompt will be displayed

#### `--npm`

> [!WARNING]  
> `--npm` is deprecated and will be removed in the future. Please use `--pm npm` instead.

Force use of npm during initialization

#### `--pm <string>`

Use specific package manager to initialize the project. Available options: `yarn`, `npm`, `bun`. Default: `yarn`

#### `--package-name <string>`

Create project with custom package name for Android and bundle identifier for iOS. The correct package name should:

- contain at least two segments separated by dots, e.g. `com.example`
- contain only alphanumeric characters and dots

#### `--skip-git-init <boolean>`

Skip git repository initialization.

#### `--replace-directory <string>`

Replaces the directory if it already exists

#### `--yarn-config-options <string>`

Passes extra options that will be added to `.yarnrc.yml` file, format: key=value,key2=value2.

### `upgrade`

Usage:

```sh
npx react-native upgrade
```

This command generates a relevant link to the [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) to help you upgrade manually.
