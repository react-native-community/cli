# React Native CLI

Command line tools to interact with React Native projects.

[![Build Status][build-badge]][build] [![Version][version-badge]][package] [![MIT License][license-badge]][license] [![PRs Welcome][prs-welcome-badge]][prs-welcome]

_Note: CLI has been extracted from core `react-native` as a part of "[Lean Core](https://github.com/facebook/react-native/issues/23313)" effort. Please read [this blog post](https://blog.callstack.io/the-react-native-cli-has-a-new-home-79b63838f0e6) for more details._

## Compatibility

This CLI is intended to be used with a certain version of React Native. You'll find the support table with compatible versions below.

| CLI    | React Native |
| ------ | ------------ |
| ^2.0.0 | ^0.60.0      |
| ^1.0.0 | ^0.59.0      |

## Documentation

- [commands](./docs/commands.md)
- [init](./docs/init.md)
- [autolinking](./docs/autolinking.md)
- [plugins](./docs/plugins.md)

## About

This repository contains tools and helpers for React Native projects in form of a CLI. We want to make a couple of things clear for you first:

- this is a monorepo;
- there are currently two CLIs: the actual one called [`@react-native-community/cli`](./packages/cli) that does all the job and global [`react-native-cli`](./packages/global-cli) which is used as its proxy and installation helper;

We know it's confusing, but we're actively working to make this indirection gone.

## Creating a new React Native project

There are two ways to start a React Native project.

### Using `npx`

> Available since `react-native@0.60`

This method is preferred if you don't want to install global packages.

```sh
npx react-native init MyApp
```

### Using global CLI

You'll need to install a global module [`react-native-cli`](./packages/global-cli) and follow instructions there.

> We strongly encourage you to **only use global `react-native-cli` for bootstrapping new projects**. Use local version for everything else.

You can find out more about init command from the [documentation](./docs/init.md)

## Usage in an existing React Native project

Once you're inside an existing project, a local `react-native` binary will be available for you to use. Feel free to use Yarn to call it directly.

Example running `start` command in terminal:

```sh
yarn react-native start
# or if you don't use Yarn:
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

## License

Everything inside this repository is [MIT licensed](./LICENSE).

<!-- badges -->

[build-badge]: https://img.shields.io/circleci/project/github/react-native-community/cli/master.svg?style=flat-square
[build]: https://circleci.com/gh/react-native-community/cli/tree/master
[version-badge]: https://img.shields.io/npm/v/@react-native-community/cli.svg?style=flat-square
[package]: https://www.npmjs.com/package/@react-native-community/cli.svg
[license-badge]: https://img.shields.io/npm/l/@react-native-community/cli.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[prs-welcome-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs-welcome]: http://makeapullrequest.com
