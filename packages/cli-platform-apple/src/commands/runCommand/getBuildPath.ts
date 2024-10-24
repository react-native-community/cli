import {CLIError} from '@react-native-community/cli-tools';
import path from 'path';
import fs from 'fs';
import {BuildSettings} from './getBuildSettings';
import {ApplePlatform} from '../../types';

export async function getBuildPath(
  buildSettings: BuildSettings,
  platform: ApplePlatform = 'ios',
  isCatalyst: boolean = false,
) {
  let targetBuildDir = buildSettings.TARGET_BUILD_DIR;
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

  // Default is platform == ios && isCatalyst == false
  let buildPath = path.join(targetBuildDir, executableFolderPath);

  // platform == ios && isCatalyst == true needs build path suffix,
  // but this regresses from time to time with suffix present or not
  // so check - there may be one already, or we may need to add suffix
  if (platform === 'ios' && isCatalyst) {
    // make sure path has one and only one '-maccatalyst' suffix on end
    if (!targetBuildDir.match(/-maccatalyst$/)) {
      targetBuildDir = `${targetBuildDir}-maccatalyst`;
    }
    buildPath = path.join(targetBuildDir, executableFolderPath);
  }

  // macOS gets the product name, not the executable folder path
  if (platform === 'macos') {
    buildPath = path.join(targetBuildDir, fullProductName);
  }

  // Make sure the directory exists and fail fast vs silently failing
  if (!fs.existsSync(targetBuildDir)) {
    throw new CLIError(
      `target build directory ${targetBuildDir} does not exist`,
    );
  }

  return buildPath;
}
