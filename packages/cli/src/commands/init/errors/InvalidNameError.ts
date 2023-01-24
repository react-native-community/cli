import {CLIError} from '@react-native-community/cli-tools';

export default class InvalidNameError extends CLIError {
  constructor(name: string) {
    super(
      `"${name}" is not a valid name for a project. Please use a valid identifier name (alphanumeric).`,
    );
  }
}
