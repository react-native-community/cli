import {CLIError} from '@react-native-community/cli-tools';

export function checkIfConfigurationExists(
  configurations: string[],
  mode: string,
) {
  if (!configurations.includes(mode)) {
    throw new CLIError(
      `Configuration "${mode}" does not exist in your project. Please use one of the existing configurations: ${configurations.join(
        ', ',
      )}`,
    );
  }
}
