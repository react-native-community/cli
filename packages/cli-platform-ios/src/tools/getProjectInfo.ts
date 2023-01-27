import {CLIError} from '@react-native-community/cli-tools';
import execa from 'execa';
import {IosProjectInfo} from '../types';

export function getProjectInfo(): IosProjectInfo {
  try {
    const {project} = JSON.parse(
      execa.sync('xcodebuild', ['-list', '-json']).stdout,
    );

    return project;
  } catch (error) {
    throw new CLIError(error);
  }
}
