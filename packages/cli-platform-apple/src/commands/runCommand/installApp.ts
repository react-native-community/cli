import child_process from 'child_process';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import chalk from 'chalk';
import {getBuildPath} from './getBuildPath';
import {getBuildSettings} from './getBuildSettings';
import path from 'path';
import {ApplePlatform} from '../../types';

function handleLaunchResult(
  success: boolean,
  errorMessage: string,
  errorDetails = '',
) {
  if (success) {
    logger.success('Successfully launched the app');
  } else {
    logger.error(errorMessage, errorDetails);
  }
}

type Options = {
  buildOutput: any;
  xcodeProject: IOSProjectInfo;
  mode: string;
  scheme: string;
  target?: string;
  udid: string;
  binaryPath?: string;
  platform?: ApplePlatform;
};

export default async function installApp({
  buildOutput,
  xcodeProject,
  mode,
  scheme,
  target,
  udid,
  binaryPath,
  platform,
}: Options) {
  let appPath = binaryPath;

  const buildSettings = await getBuildSettings(
    xcodeProject,
    mode,
    buildOutput,
    scheme,
    target,
  );

  if (!buildSettings) {
    throw new CLIError('Failed to get build settings for your project');
  }

  if (!appPath) {
    appPath = await getBuildPath(buildSettings, platform);
  }

  const targetBuildDir = buildSettings.TARGET_BUILD_DIR;
  const infoPlistPath = buildSettings.INFOPLIST_PATH;

  if (!infoPlistPath) {
    throw new CLIError('Failed to find Info.plist');
  }

  if (!targetBuildDir) {
    throw new CLIError('Failed to get target build directory.');
  }

  logger.info(`Installing "${chalk.bold(appPath)}`);

  if (udid && appPath) {
    child_process.spawnSync('xcrun', ['simctl', 'install', udid, appPath], {
      stdio: 'inherit',
    });
  }

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      [
        '-c',
        'Print:CFBundleIdentifier',
        path.join(targetBuildDir, infoPlistPath),
      ],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(`Launching "${chalk.bold(bundleID)}"`);

  let result = child_process.spawnSync('xcrun', [
    'simctl',
    'launch',
    udid,
    bundleID,
  ]);

  handleLaunchResult(
    result.status === 0,
    'Failed to launch the app on simulator',
    result.stderr.toString(),
  );
}
