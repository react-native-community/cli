import {CLIError} from '@react-native-community/cli-tools';

export default class ReservedNameError extends CLIError {
  constructor(name: string) {
    super(
      `Not a valid name for a project. Please do not use the reserved word "${name}".`,
    );
  }
}
