import fs from 'fs';
import {IOSProjectConfig} from '@react-native-community/cli-types';
import {CLIError} from '@react-native-community/cli-tools';
import findXcodeProject from '../../config/findXcodeProject';

export function getXcodeProjectAndDir(
  iosProjectConfig: IOSProjectConfig | undefined,
  installedPods?: boolean,
) {
  if (!iosProjectConfig) {
    throw new CLIError(
      'iOS project folder not found. Are you sure this is a React Native project?',
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
