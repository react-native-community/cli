import fs from 'fs';
import {IOSProjectConfig} from '@react-native-community/cli-types';
import {CLIError} from '@react-native-community/cli-tools';
import findXcodeProject from '../../config/findXcodeProject';
import {getPlatformInfo} from '../runCommand/getPlatformInfo';
import {ApplePlatform} from '../../types';

export function getXcodeProjectAndDir(
  iosProjectConfig: IOSProjectConfig | undefined,
  platformName: ApplePlatform,
  installedPods?: boolean,
) {
  const {readableName: platformReadableName} = getPlatformInfo(platformName);

  if (!iosProjectConfig) {
    throw new CLIError(
      `${platformReadableName} project folder not found. Make sure that project.${platformName}.sourceDir points to a directory with your Xcode project and that you are running this command inside of React Native project.`,
    );
  }

  let {xcodeProject, sourceDir} = iosProjectConfig;

  if (!xcodeProject) {
    throw new CLIError(
      `Could not find Xcode project files in "${sourceDir}" folder`,
    );
  }

  // if project is freshly created, revisit Xcode project to verify Pods are installed correctly.
  // This is needed because ctx project is created before Pods are installed, so it might have outdated information.
  if (installedPods) {
    const recheckXcodeProject = findXcodeProject(fs.readdirSync(sourceDir));
    if (recheckXcodeProject) {
      xcodeProject = recheckXcodeProject;
    }
  }

  return {xcodeProject, sourceDir};
}
