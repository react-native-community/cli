# React Native CLI

Command line tools that ship with [`react-native`](https://github.com/facebook/react-native) in form of the `@react-native-community/cli` package.

> It exposes `react-native` binary, so you can call `yarn react-native` or `npx react-native` directly from your project.

[![Build Status][build-badge]][build] [![Version][version-badge]][package] [![MIT License][license-badge]][license] [![PRs Welcome][prs-welcome-badge]][prs-welcome] [![Lean Core Extracted][lean-core-badge]][lean-core]

_Note: CLI has been extracted from core `react-native` as a part of "[Lean Core](https://github.com/facebook/react-native/issues/23313)" effort. Please read [this blog post](https://blog.callstack.io/the-react-native-cli-has-a-new-home-79b63838f0e6) for more details._

## Contents

- [Compatibility](#compatibility)
- [Documentation](#documentation)
- [About](#about)
- [Creating a new React Native project](#creating-a-new-react-native-project)
  - [Using `npx` (_recommended_)](#using-npx-recommended)
- [Usage in an existing React Native project](#usage-in-an-existing-react-native-project)
- [Updating the CLI](#updating-the-cli)
- [Contributing](./CONTRIBUTING.md)
- [Maintainers](#maintainers)
- [License](#license)

## Compatibility

Our release cycle is independent of `react-native`. We follow semver and here is the compatibility table:

| `@react-native-community/cli`                                      | `react-native` |
| ------------------------------------------------------------------ | -------------- |
| [^6.0.0 (`master`)](https://github.com/react-native-community/cli) | ^0.65.0        |
| [^5.0.0](https://github.com/react-native-community/cli/tree/5.x)   | ^0.64.0        |
| [^4.0.0](https://github.com/react-native-community/cli/tree/4.x)   | ^0.62.0        |
| [^3.0.0](https://github.com/react-native-community/cli/tree/3.x)   | ^0.61.0        |
| [^2.0.0](https://github.com/react-native-community/cli/tree/2.x)   | ^0.60.0        |
| [^1.0.0](https://github.com/react-native-community/cli/tree/1.x)   | ^0.59.0        |

## Documentation

- [configuration](./docs/configuration.md)
- [commands](./docs/commands.md)
- [plugins](./docs/plugins.md)
- [init](./docs/init.md)
- [autolinking](./docs/autolinking.md)

## About

This repository contains tools and helpers for React Native projects in form of a command line tool. There's been quite some confusion around that since the extraction from React Native core. Let's clear them up:

- There are currently two CLIs:
  - [`@react-native-community/cli`](./packages/cli) – **the one used directly by `react-native`**. That makes it a transitive dependency of your project.
  - [`react-native-cli`](./packages/global-cli) – an optional global convenience package, which is a proxy to [`@react-native-community/cli`](./packages/cli) and global installation helper. **Please consider it legacy, because it's not necessary anymore**.
- When we say "the CLI" we mean `@react-native-community/cli`.
- We update the CLI independently of React Native itself. Please see [how to use the latest version](#updating-the-cli).
- This is a monorepo to keep stuff organized.

We're actively working to make any indirections gone.

## Creating a new React Native project

There are two ways to start a React Native project.

### Using `npx` (_recommended_)

> Available since `react-native@0.60`

This method is preferred if you don't want to install global packages.

```sh
npx react-native init MyApp
```

## Usage in an existing React Native project

Once you're inside an existing project, a local `react-native` binary will be available for you to use. Feel free to use Yarn to call it directly.

Example running `start` command in terminal:

```sh
yarn react-native start
# or:
npx react-native start
# or
node ./node_modules/.bin/react-native start
```

You can also add npm scripts to call it with whichever package manager you use:

```json
{
  "scripts": {
    "start": "react-native start"
  }
}
```

## Updating the CLI

React Native CLI is a dependency of `react-native`, which makes it a transitive dependency of your project. It happens that you may be locked on a version without fixes for bugs that may affect you. Here's how to get it sorted:

1. If you use lock files (`yarn.lock` or `package-lock.json`) - find all the `@react-native-community/cli` prefixed entries, remove them, run `yarn install` / `npm install` once again.
   Here's an example using `yarn.lock`. Notice how _whole `@react-native-community/cli` entries_ are removed. Make sure to delete all of them:

   ```diff
   diff --git a/yarn.lock b/yarn.lock
   index 073309f..0bb8c4b 100644
   --- a/yarn.lock
   +++ b/yarn.lock
   @@ -843,26 +843,6 @@
        "@types/istanbul-reports" "^1.1.1"
        "@types/yargs" "^13.0.0"

   -"@react-native-community/cli-debugger-ui@^3.0.0":
   -  version "3.0.0"
   -  resolved "https://registry.yarnpkg.com/@react-native-community/cli-debugger-ui/-/cli-debugger-ui-3.0.0.tgz#d01d08d1e5ddc1633d82c7d84d48fff07bd39416"
   -  integrity sha512-m3X+iWLsK/H7/b7PpbNO33eQayR/+M26la4ZbYe1KRke5Umg4PIWsvg21O8Tw4uJcY8LA5hsP+rBi/syBkBf0g==
   -  dependencies:
   -    serve-static "^1.13.1"
   -
   -"@react-native-community/cli-platform-android@^3.0.0":
   -  version "3.1.2"
   -  resolved "https://registry.yarnpkg.com/@react-native-community/cli-platform-android/-/cli-platform-android-3.1.2.tgz#313644fba81b5d673cc803009e1eddc930b9618c"
   -  integrity sha512-H30a00LLigsTh4eO0kc2YtaIkOJKrValWOU6n2VES3ZGS31qDx9GhZIwMCMcdzcSnypAyMAfauVatEmBSQZU7Q==
   -  dependencies:
   -    "@react-native-community/cli-tools" "^3.0.0"
   -    chalk "^2.4.2"
   ```

2. If you don't use lock files – remove `node_modules` and run `yarn install` / `npm install` again.
3. Run `yarn list --pattern @react-native-community/cli` or `npm list @react-native-community/cli` and verify you're on the latest version.

After performing these steps you should be on the latest CLI version. Feel free to do it once in a while, because we release often.

## Maintainers

- Michał Pierzchała ([**@thymikee**](https://github.com/thymikee)) - [Callstack](https://callstack.com)
- Mike Grabowski ([**@grabbou**](https://github.com/grabbou)) - [Callstack](https://callstack.com)
- Kacper Wiszczuk ([**@esemesek**](https://github.com/esemesek))

## License

Everything inside this repository is [MIT licensed](./LICENSE).

<!-- badges -->

[build-badge]: https://img.shields.io/circleci/project/github/react-native-community/cli/master.svg?style=flat-square
[build]: https://circleci.com/gh/react-native-community/cli/tree/master
[version-badge]: https://img.shields.io/npm/v/@react-native-community/cli.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native-community/cli
[license-badge]: https://img.shields.io/npm/l/@react-native-community/cli.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg?style=flat-square
[lean-core]: https://github.com/facebook/react-native/issues/23313
