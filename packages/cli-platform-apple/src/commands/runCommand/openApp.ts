import {CLIError, logger} from '@react-native-community/cli-tools';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import chalk from 'chalk';
import {getBuildPath} from './getBuildPath';
import {getBuildSettings} from './getBuildSettings';
import execa from 'execa';

type Options = {
  buildOutput: string;
  xcodeProject: IOSProjectInfo;
  mode: string;
  scheme: string;
  target?: string;
  binaryPath?: string;
};

export default async function openApp({
  buildOutput,
  xcodeProject,
  mode,
  scheme,
  target,
  binaryPath,
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
    appPath = await getBuildPath(buildSettings, 'macos');
  }

  logger.info(`Opening "${chalk.bold(appPath)}"`);

  try {
    await execa(`open ${appPath}`);
    logger.success('Successfully launched the app');
  } catch (e) {
    logger.error('Failed to launch the app', e as string);
  }
}
