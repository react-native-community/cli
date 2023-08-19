import {CLIError, logger} from '@react-native-community/cli-tools';
import {IosProjectInfo} from '../types';

export function checkIfConfigurationExists(
  project: IosProjectInfo,
  mode: string,
) {
  if (!project) {
    logger.warn(`Unable to check whether "${mode}" exists in your project`);
    return;
  }

  if (!project.configurations.includes(mode)) {
    throw new CLIError(
      `Configuration "${mode}" does not exist in your project. Please use one of the existing configurations: ${project.configurations.join(
        ', ',
      )}`,
    );
  }
}
