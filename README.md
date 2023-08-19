# React Native CLI

Command line tools that ship with [`react-native`](https://github.com/facebook/react-native) in form of the `@react-native-community/cli` package.

> It exposes `react-native` binary, so you can call `yarn react-native` or `npx react-native` directly from your project.

[![Build Status][build-badge]][build] [![Version][version-badge]][package] [![MIT License][license-badge]][license] [![PRs Welcome][prs-welcome-badge]][prs-welcome] [![Lean Core Extracted][lean-core-badge]][lean-core]

_Note: CLI has been extracted from core `react-native` as a part of "[Lean Core](https://github.com/facebook/react-native/issues/23313)" effort. Please read [this blog post](https://www.callstack.com/blog/the-react-native-cli-has-a-new-home) for more details._

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

| `@react-native-community/cli`                                      | `react-native`          |
| ------------------------------------------------------------------ | ----------------------- |
| [^12.0.0](https://github.com/react-native-community/cli/tree/main) | ^0.73.0                 |
| [^11.0.0](https://github.com/react-native-community/cli/tree/11.x) | ^0.72.0                 |
| [^10.0.0](https://github.com/react-native-community/cli/tree/10.x) | ^0.71.0                 |
| [^9.0.0](https://github.com/react-native-community/cli/tree/9.x)   | ^0.70.0                 |
| [^8.0.0](https://github.com/react-native-community/cli/tree/8.x)   | ^0.69.0                 |
| [^7.0.0](https://github.com/react-native-community/cli/tree/7.x)   | ^0.68.0                 |
| [^6.0.0](https://github.com/react-native-community/cli/tree/6.x)   | ^0.65.0,^0.66.0,^0.67.0 |
| [^5.0.0](https://github.com/react-native-community/cli/tree/5.x)   | ^0.64.0                 |
| [^4.0.0](https://github.com/react-native-community/cli/tree/4.x)   | ^0.62.0,^0.63.0         |
| [^3.0.0](https://github.com/react-native-community/cli/tree/3.x)   | ^0.61.0                 |
| [^2.0.0](https://github.com/react-native-community/cli/tree/2.x)   | ^0.60.0                 |
| [^1.0.0](https://github.com/react-native-community/cli/tree/1.x)   | ^0.59.0                 |

## Documentation

- [configuration](./docs/configuration.md)
- [commands](./docs/commands.md)
- [plugins](./docs/plugins.md)
- [init](./docs/init.md)
- [autolinking](./docs/autolinking.md)

## About

This monorepository contains tools and helpers for React Native projects in form of a Command Line Tool (or CLI). This CLI is used directly by the `react-native` package and is not intended for use directly. We update it independently of React Native itself.

## Creating a new React Native project

Run the following command in your terminal prompt:

```sh
npx react-native@latest init MyApp
```

## Usage in an existing React Native project

Once you're inside an existing project, a local `react-native` binary will be available for you to use. Feel free to use Yarn to call it directly.

Example running `start` command in terminal:

```sh
yarn react-native start
# or:
npx react-native start
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

- Adam Trzciński ([**@adamTrz**](https://github.com/adamTrz)) - [Callstack](https://callstack.com)
- Michał Pierzchała ([**@thymikee**](https://github.com/thymikee)) - [Callstack](https://callstack.com)

Previously:

- Mike Grabowski ([**@grabbou**](https://github.com/grabbou)) - [Callstack](https://callstack.com)
- Kacper Wiszczuk ([**@esemesek**](https://github.com/esemesek))

## License

Everything inside this repository is [MIT licensed](./LICENSE).

<!-- badges -->

[build-badge]: https://img.shields.io/github/actions/workflow/status/react-native-community/cli/test.yml?branch=main&style=flat-square
[build]: https://github.com/react-native-community/cli/actions/workflows/test.yml
[version-badge]: https://img.shields.io/npm/v/@react-native-community/cli.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native-community/cli
[license-badge]: https://img.shields.io/npm/l/@react-native-community/cli.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
[lean-core-badge]: https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg?style=flat-square
[lean-core]: https://github.com/facebook/react-native/issues/23313
