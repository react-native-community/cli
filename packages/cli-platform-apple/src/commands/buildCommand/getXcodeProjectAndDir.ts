import {IOSProjectConfig} from '@react-native-community/cli-types';
import {CLIError} from '@react-native-community/cli-tools';

export function getXcodeProjectAndDir(
  iosProjectConfig: IOSProjectConfig | undefined,
) {
  if (!iosProjectConfig) {
    throw new CLIError(
      'iOS project folder not found. Are you sure this is a React Native project?',
    );
  }

  const {xcodeProject, sourceDir} = iosProjectConfig;

  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${sourceDir}" folder`,
    );
  }

  return {xcodeProject, sourceDir};
}
