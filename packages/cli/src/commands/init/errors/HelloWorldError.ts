import {CLIError} from '@react-native-community/cli-tools';

export default class HelloWorldError extends CLIError {
  constructor() {
    super(
      'Project name shouldn\'t contain "HelloWorld" name in it, because it is CLI\'s default placeholder name.',
    );
  }
}
