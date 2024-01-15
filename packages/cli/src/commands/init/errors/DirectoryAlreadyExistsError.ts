import {CLIError} from '@react-native-community/cli-tools';

export default class DirectoryAlreadyExistsError extends CLIError {
  constructor(directory: string) {
    super(
      `Cannot initialize new project because directory "${directory}" already exists. Please remove or rename the directory and try again.`,
    );
  }
}
