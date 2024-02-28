import {CLIError} from '@react-native-community/cli-tools';
import path from 'path';
import {BuildSettings} from './getBuildSettings';
import {ApplePlatform} from '../../types';

export async function getBuildPath(
  buildSettings: BuildSettings,
  platform: ApplePlatform = 'ios',
  isCatalyst: boolean = false,
) {
  const targetBuildDir = buildSettings.TARGET_BUILD_DIR;
  const executableFolderPath = buildSettings.EXECUTABLE_FOLDER_PATH;
  const fullProductName = buildSettings.FULL_PRODUCT_NAME;

  if (!targetBuildDir) {
    throw new CLIError('Failed to get the target build directory.');
  }

  if (!executableFolderPath) {
    throw new CLIError('Failed to get the app name.');
  }

  if (!fullProductName) {
    throw new CLIError('Failed to get product name.');
  }

  if (isCatalyst) {
    return path.join(`${targetBuildDir}-maccatalyst`, executableFolderPath);
  } else if (platform === 'macos') {
    return path.join(targetBuildDir, fullProductName);
  } else {
    return path.join(targetBuildDir, executableFolderPath);
  }
}
