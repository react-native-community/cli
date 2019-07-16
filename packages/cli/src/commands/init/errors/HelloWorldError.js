// @flow
export default class HelloWorldError extends Error {
  constructor() {
    super(
      'Project name shouldn\'t contain "HelloWorld" name in it, because it is CLI\'s default placeholder name. You can find more information https://github.com/react-native-community/cli/issues/441',
    );
  }
}
