# React Native Community CLI

[![npm package](https://img.shields.io/npm/v/@react-native-community/cli?label=latest%20stable)](https://www.npmjs.com/package/@react-native-community/cli)

Command line tools for building apps with [React Native](https://reactnative.dev), shipped as the `@react-native-community/cli` npm package.

See also the [Community Template](https://github.com/react-native-community/template).

## Docs

- [Initializing a new project](https://github.com/react-native-community/cli/tree/main/docs/init.md)
- [Configuration](https://github.com/react-native-community/cli/tree/main/docs/configuration.md)
- [Commands](https://github.com/react-native-community/cli/tree/main/docs/commands.md)
- [Plugins](https://github.com/react-native-community/cli/tree/main/docs/plugins.md)
- [Autolinking](https://github.com/react-native-community/cli/tree/main/docs/autolinking.md)

## Compatibility

Our release cycle is independent of `react-native`.

> [!Warning]
> **Important**: `@react-native-community/cli` is designed to work with specific `react-native` versions. We do not recommend updating CLI independently, as it may cause unexpected issues.

| `@react-native-community/cli`                                      | `react-native`            |
| ------------------------------------------------------------------ | ------------------------- |
| [^20.0.0](https://github.com/react-native-community/cli/tree/main) | ^0.81.0, ^0.82.0, ^0.83.0, ^0.84.0, ^0.85.0 |
| [^19.0.0](https://github.com/react-native-community/cli/tree/19.x) | ^0.80.0                   |
| [^18.0.0](https://github.com/react-native-community/cli/tree/18.x) | ^0.79.0                   |
| [^15.0.0](https://github.com/react-native-community/cli/tree/15.x) | ^0.76.0, ^0.77.0, ^0.78.0 |

[Previous versions](https://github.com/react-native-community/cli/blob/b26aa65/README.md)

## Creating a new React Native project

Run the following command in your terminal prompt:

```sh
npx @react-native-community/cli@latest init MyApp
```

See more options for the `init` command [here](https://github.com/react-native-community/cli/blob/main/docs/init.md).

## Usage in an existing React Native project

Once installed, you can run commands to interact with your projects by using the `rnc-cli` binary.

Example running `start` command in terminal:

```sh
yarn rnc-cli start
```

You can also add npm scripts to call it with whichever package manager you use:

```json
{
  "scripts": {
    "start": "rnc-cli start"
  }
}
```

to call it as

```sh
yarn start
```

## Maintainers

- Michał Pierzchała ([**@thymikee**](https://github.com/thymikee)) - [Callstack](https://callstack.com)
- Alex Hunt ([**@huntie**](https://github.com/huntie)) - [Meta](https://meta.com)

Previously:

- Szymon Rybczak ([**@szymonrybczak**](https://github.com/szymonrybczak))
- Mike Grabowski ([**@grabbou**](https://github.com/grabbou)) - [Callstack](https://callstack.com)
- Kacper Wiszczuk ([**@esemesek**](https://github.com/esemesek)) - [Callstack](https://callstack.com)
- Adam Trzciński ([**@adamTrz**](https://github.com/adamTrz)) - [Callstack](https://callstack.com)

## License

Everything inside this repository is [MIT licensed](./LICENSE).
