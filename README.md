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

> [!INFO]
> Please do it only if you need to. We don't recommend updating CLI independently of `react-native` as it may cause unexpected issues.

React Native CLI is a dependency of `react-native`, which makes it a transitive dependency of your project. You can overwrite the version independently of `react-native` by using `resolutions` field in your `package.json`:

```json
{
  "resolutions": {
    "@react-native-community/cli": "^11.3.5",
    "@react-native-community/cli-platform-ios": "^11.3.5",
  }
}
```

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
