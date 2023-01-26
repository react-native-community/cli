import {CLIError} from '@react-native-community/cli-tools';
import {IosProjectInfo} from '../types';

export function checkIfConfigurationExists(
  project: IosProjectInfo,
  mode: string,
) {
  if (!project.configurations.includes(mode)) {
    throw new CLIError(
      `Configuration "${mode}" does not exist in your project. Please use one of the existing configurations: ${project.configurations.join(
        ', ',
      )}`,
    );
  }
}
