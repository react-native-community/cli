import child_process from 'child_process';
import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import pico from 'picocolors';
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
  buildOutput: string;
  xcodeProject: IOSProjectInfo;
  mode: string;
  scheme: string;
  target?: string;
  udid: string;
  binaryPath?: string;
  platform?: ApplePlatform;
  isSimulator?: boolean;
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
  isSimulator = true,
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

  const plistPath = appPath
    ? path.join(appPath, 'Info.plist')
    : path.join(targetBuildDir, infoPlistPath);
  if (!plistPath) {
    throw new CLIError('Failed to find Info.plist');
  }

  if (!targetBuildDir) {
    throw new CLIError('Failed to get target build directory.');
  }

  logger.info(`Installing "${pico.bold(appPath)}`);

  if (udid && appPath) {
    const installParameters = isSimulator
      ? ['simctl', 'install', udid, appPath]
      : ['devicectl', 'device', 'install', 'app', '--device', udid, appPath];

    child_process.spawnSync('xcrun', installParameters, {
      stdio: 'inherit',
    });
  }

  const bundleID = child_process
    .execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', plistPath],
      {encoding: 'utf8'},
    )
    .trim();

  logger.info(`Launching "${pico.bold(bundleID)}"`);

  const launchParameters = isSimulator
    ? ['simctl', 'launch', udid, bundleID]
    : ['devicectl', 'device', 'process', 'launch', '--device', udid, bundleID];

  const result = child_process.spawnSync('xcrun', launchParameters);

  handleLaunchResult(
    result.status === 0,
    'Failed to launch the app on simulator',
    result.stderr.toString(),
  );
}
