# Initializing new project

There are couple of ways to initialize new React Native projects.

### For `react-native@0.60.0` or greater

#### Using `npx` utility:

```sh
npx react-native init ProjectName
```

> Note: If you have both `yarn` and `npm` installed on your machine, React Native CLI will always try to use `yarn`, so even if you use `npx` utility, only `react-native` executable will be installed using `npm` and the rest of the work will be delegated to `yarn`. You can force usage of `npm` adding `--npm` flag to the command.

> Note: for Yarn users, `yarn dlx` command similar to `npx` will be featured in Yarn 2.0: https://github.com/yarnpkg/berry/pull/40 so we’ll be able to use it in a similar fashion.

#### Installing `react-native` and invoking `init` command:

```sh
yarn init && yarn add react-native && yarn react-native init ProjectName
```

#### Initializing project with custom version of `react-native`:

```sh
# This will use the latest init command but will install react-native@VERSION and use its template
npx react-native init ProjectName --version ${VERSION}

# This will use init command from react-native@VERSION
npx react-native@${VERSION} init ProjectName
```

#### Initializing project with custom template.

In following examples `TEMPLATE_NAME` can be either:
- Full package name, eg. `react-native-template-typescript`.
- Shorthand name of template, eg. `typescript`.
- Absolute path to directory containing template, eg. `file:///Users/username/project/some-template`.

```sh
# This will initialize new project using template from TEMPLATE_NAME package
npx react-native init ProjectName --template ${TEMPLATE_NAME}

# This will initialize new project using init command from react-native@VERSION but will use TEMPLATE_NAME custom template
npx react-native@${VERSION} init ProjectName --template ${TEMPLATE_NAME}
```

You can force usage of `npm` if you have both `yarn` and `npm` installed on your machine:
```sh
npx react-native init ProjectName --npm
```

### For older `react-native` versions

Using legacy `react-native-cli` package:

```sh
yarn global add react-native-cli
react-native init ProjectName
```

> Note: It is not recommended, but you can also use legacy `react-native-cli` package to initialize projects using latest `react-native` versions.

# Creating custom template

Every custom template needs to have configuration file called `template.config.js` in the root of the project:

```js
module.exports = {
  // Placeholder name that will be replaced in package.json, index.json, android/, ios/ for a project name.
  placeholderName: "ProjectName",

  // Directory with the template which will be copied and processed by React Native CLI. Template directory should have package.json with all dependencies specified, including `react-native`.
  templateDir: "./template",

  // Path to script, which will be executed after initialization process, but before installing all the dependencies specified in the template.
  postInitScript: "./script.js",
};
```

You can find example custom template [here](https://github.com/Esemesek/react-native-new-template).
