# Contributing to React Native CLI

## Development Process

All work on React Native CLI happens directly on GitHub. Contributors send pull requests which go through review process.

> **Working on your first pull request?** You can learn how from this *free* series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

1. Fork the repo and create your branch from `master` (a guide on [how to fork a repository](https://help.github.com/articles/fork-a-repo/)).
2. Run `yarn` or `npm install` to install all required dependencies.
3. Now you are ready to do the changes.

## Repository

Repository is splitted into two packages:

* `cli` - Historically, it was included in `react-native` package. Contains all the commands code.
* `global-cli` - Historically, it was a `react-native-cli` package and the only reason this package existed was to initialize an empty project.

## Testing your changes

You can test your changes by calling `cli.js` directly from the cloned repository. You need to make sure the version of React Native matches the one present in devDependencies of the CLI. Otherwise, you may get unexpected errors.

```sh
node /path/to/cloned/project/packages/cli/index.js
```

## Typechecking, linting and testing

Currently we use `flow` for typechecking, `eslint` with `prettier` for linting and formatting the code and `jest` for testing.

* `yarn flow`: run `flow`
* `yarn lint`: run `eslint` and `prettier`
* `yarn test`: run unit tests

## Commit message convention

We prefix our commit messages with one of the following to signify the kind of change:

* **build**: Changes that affect the build system or external dependencies
* **ci**, **chore**: Changes to our CI configuration files and scripts
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code
* **test**: Adding missing tests or correcting existing tests

## Sending a pull request

When you're sending a pull request:

* Prefer small pull requests focused on one change.
* Verify that `flow`, `eslint` and all tests are passing.
* Preview the documentation to make sure it looks good.
* Follow the pull request template when opening a pull request.

## Reporting issues

You can report issues on our [bug tracker](https://github.com/react-native-community/react-native-cli/issues). Please follow the issue template when opening an issue.

## License

By contributing to React Native CLI, you agree that your contributions will be licensed under its **MIT** license.
