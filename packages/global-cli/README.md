## React Native Global CLI

`react-native-cli` is a command line tool for initializing React Native projects.

## Installation

Install it as a global module:

```sh
yarn global add react-native-cli
```

It will create a global `react-native` binary (even though the package name is `react-native-cli`).

## Usage

To create a new React Native Project called "AwesomeProject" you can run:

```sh
react-native init AwesomeProject
```

It will install `react-native`, `react`, `jest` and a bunch of other necessary packages from the [default template](https://github.com/facebook/react-native/tree/master/template).

After it's finished, your AwesomeProject should be ready to use. From this point, you should use your local `react-native` binary to run the proper [React Native CLI](../cli):

```sh
yarn react-native link native-dep
```

## Options

### `--template`

Use a custom template.

Example: this will install init your AwesomeProject using template called `react-native-template-samplename` from npm:

```sh
react-native init AwesomeProject --template samplename
```

You can also pass remote git address and local filepath as a `--template` parameter.

### `--version`

Use a custom version. By default `react-native init` will use the latest stable.

Example: this will install init your AwesomeProject using version `0.57.0`:

```sh
react-native init AwesomeProject --version 0.57.0
```

You can also install a specific tag, like `next`, using:

```sh
react-native init AwesomeProject --version react-native@next
```

## Future work

We understand this is counter-intuitive to have two packages for interacting with React Native and it makes the first experience with the framework a bit confusing.

That's why, as a part of [Lean Core](https://github.com/facebook/react-native/issues/23313) initiative, there's an [ongoing effort](https://github.com/react-native-community/react-native-cli/issues/76) to remove this module so we can use just `react-native` as the only package necessary to install and run React Native commands.
