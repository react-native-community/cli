## React Native Global CLI

`react-native-cli` is a command line tool for initializing React Native projects.

## Usage

We recommend using `react-native-cli` with `npx` so you don't need to pollute your global packages scope.

To create a new React Native Project called "AwesomeProject" you can run:

```sh
npx react-native-cli init AwesomeProject
```

It will install `react-native`, `react`, `jest` and a bunch of other necessary packages from the default template.

After it's finished, your AwesomeProject should be ready to use. From this point, you should use your local `react-native` binary to run the proper [React Native CLI](../cli):

```
yarn react-native link native-dep
```

## Future work

We understand this is counter-intuitive to have two packages for interacting with React Native and it makes the first experience with the framework a bit confusing.

That's why, as a part of [Lean Core](https://github.com/facebook/react-native/issues/23313) initiative, there's an ongoing effort to remove this module so we can use just `react-native` as the only package necessary to install and run React Native commands.
