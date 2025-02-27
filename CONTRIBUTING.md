# Contributing to React Native CLI

## Development Process

All work on React Native CLI happens directly on GitHub. Contributors send pull requests which go through review process.

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

1. Fork the repo and create your branch from `main` (a guide on [how to fork a repository](https://help.github.com/articles/fork-a-repo/)).
2. Run `yarn` or `npm install` to install all required dependencies.
3. Run `yarn watch` to automatically build the changed files.
4. Now you are ready to do the changes.

## Testing your changes

> Please make sure the version of React Native matches the one present in devDependencies of the CLI. Otherwise, you may get unexpected errors.

_Note: you must use the `--watchFolders` flag with the `start` command when testing the CLI with `yarn link` like this. Otherwise Metro can't find the symlinked folder and this may result in errors such as `ReferenceError: SHA-1 for file ... is not computed`. If you are experiencing this error while using Release configuration, please add `watchFolders: ["path/to/cloned/cli/"]` to your `metro.config.js` file._

### Setup

Because of a modular design of the CLI, we recommend developing using symbolic links to its packages. This way you can use it seamlessly in the tested project, as you'd use the locally installed CLI. Here's what you need to run in the terminal:

#### yarn v1

```sh
cd /path/to/cloned/cli/
yarn link-packages
```

And then:

```sh
cd /my/new/react-native/project/
yarn link "@react-native-community/cli-platform-ios" "@react-native-community/cli-platform-android" "@react-native-community/cli" "@react-native-community/cli-server-api" "@react-native-community/cli-types" "@react-native-community/cli-tools" "@react-native-community/cli-clean" "@react-native-community/cli-doctor" "@react-native-community/cli-config" "@react-native-community/cli-platform-apple" "@react-native-community/cli-link-assets"
```

Once you're done with testing and you'd like to get back to regular setup, run `yarn unlink` instead of `yarn link` from above command. Then `yarn install --force`.

#### yarn v2

```sh
cd /my/new/react-native/project/
yarn link /path/to/cloned/cli/ --all
```

When you'd like to revert to a regular setup, you will need to revert the changes made to the `resolutions` field of `package.json`.

#### Manual

If you don't want to use `yarn link`, you can run CLI from the source:

```sh
node /path/to/cloned/cli/packages/cli/build/bin.js <command>
```

### Running

```sh
yarn react-native start --watchFolders /path/to/cloned/cli/
yarn react-native run-android
```

## Running `start` command

In order for linked dependencies to work correctly when running `start` locally, set `--watchFolders` with a path to the root folder of the CLI project:

```
node path/to/cli/packages/cli/build/bin.js start --watchFolders path/to/cli
```

## Running CLI with React Native from the source

First make sure you have RN repo checked out and CLI repo checked out and built. Then you can start a new RN project with local version of CLI and RN without publishing or proxy:

1. Check out `react-native` repo. Then update template in local `react-native/template/package.json`, replacing dependency version of `react-native` with the absolute path of the react native repo, for example: "react-native": "file:///Users/username/react-native" (you can find the absolute path using `pwd` command)

2. Go back up and create a new RN project: `node ./cli/packages/cli/build/bin.js init --template=file:///path/to/local/react-native/RNTestProject`

3. To work with android, update gradle config in the newly created project following the second part of [Christoph's instructions](https://gist.github.com/cpojer/38a91f90614f35769e88410e3a387b48)

4. Run start (as described above) and compile your app eg `node ../cli/packages/cli/build/bin.js run-android` (make sure you definitely have NDK r17c installed before building android)

## Typechecking, linting and testing

Currently we use TypeScript for typechecking, `eslint` with `prettier` for linting and formatting the code and `jest` for testing.

- `yarn lint`: run `eslint` and `prettier`
- `yarn test`: run unit tests

## Commit message convention

We prefix our commit messages with one of the following to signify the kind of change:

- **build**: Changes that affect the build system or external dependencies
- **ci**, **chore**: Changes to our CI configuration files and scripts
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **style**: Changes that do not affect the meaning of the code
- **test**: Adding missing tests or correcting existing tests

## Sending a pull request

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that TypeScript, `eslint` and all tests are passing.
- Preview the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.

## Publishing workflow

This part is for maintainers only, documenting steps to manually publish the packages with Lerna. Make sure you have publish access to the `@react-native-community/cli` and related packages.

### Stable version

1. Pull latest changes for the stable branch (we use a _N.x_ convention where _N_ stands for major version of the RNC CLI).
2. Run `yarn run publish`, it will tag the packages as `latest`.
3. Choose an appropriate version from the available options.
4. Create release notes in the project's Release tab.

### Prerelease

1. Pull latest changes for the `main` branch.
2. Run `yarn run publish:next`, it will tag the packages as `next`.
3. Use `Custom prerelease` option and go with `-alpha.N` convention.
4. Create release notes in the project's Release tab.

### Legacy version

1. Pull latest changes for the _N.x_ branch (where N stands for major legacy version).
2. Run `yarn run publish --dist-tag N.x` to tag the packages as `N.x`.
3. Choose an appropriate version from the available options.
4. Create release notes in the project's Release tab.

## Reporting issues

You can report issues on our [bug tracker](https://github.com/react-native-community/react-native-cli/issues). Please follow the issue template when opening an issue.

## Stale Bot

This repository is using bot to automatically mark issues and PRs as stale and close them. The "stale" label is added after 90 days of inactivity, and it's getting closed 7 days later. If you find the issue important or you want to keep it open for any particular reason, please show any activity in the issue or contact maintainers to add the "no-stale-bot" label, which prevents bot from closing the issues.

## License

By contributing to React Native CLI, you agree that your contributions will be licensed under its **MIT** license.
