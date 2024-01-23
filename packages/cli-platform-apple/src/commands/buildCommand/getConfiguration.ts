import chalk from 'chalk';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {logger} from '@react-native-community/cli-tools';
import {selectFromInteractiveMode} from '../../tools/selectFromInteractiveMode';
import {getInfo} from '../../tools/getInfo';
import {checkIfConfigurationExists} from '../../tools/checkIfConfigurationExists';
import type {BuildFlags} from './buildOptions';
import {getBuildConfigurationFromXcScheme} from '../../tools/getBuildConfigurationFromXcScheme';
import path from 'path';
import {getPlatformInfo} from '../runCommand/getPlatformInfo';
import {ApplePlatform} from '../../types';

export async function getConfiguration(
  xcodeProject: IOSProjectInfo,
  sourceDir: string,
  args: BuildFlags,
  platformName: ApplePlatform,
) {
  const info = getInfo();

  if (args.mode) {
    checkIfConfigurationExists(info?.configurations ?? [], args.mode);
  }

  let scheme =
    args.scheme ||
    path.basename(xcodeProject.name, path.extname(xcodeProject.name));

  if (!info?.schemes?.includes(scheme)) {
    const {readableName} = getPlatformInfo(platformName);
    const fallbackScheme = `${scheme}-${readableName}`;

    if (info?.schemes?.includes(fallbackScheme)) {
      logger.warn(
        `Scheme "${chalk.bold(
          scheme,
        )}" doesn't exist. Using fallback scheme "${chalk.bold(
          fallbackScheme,
        )}"`,
      );

      scheme = fallbackScheme;
    }
  }

  let mode =
    args.mode ||
    getBuildConfigurationFromXcScheme(scheme, 'Debug', sourceDir, info);

  if (args.interactive) {
    const selection = await selectFromInteractiveMode({
      scheme,
      mode,
      info,
    });

    if (selection.scheme) {
      scheme = selection.scheme;
    }

    if (selection.mode) {
      mode = selection.mode;
    }
  }

  logger.info(
    `Found Xcode ${
      xcodeProject.isWorkspace ? 'workspace' : 'project'
    } "${chalk.bold(xcodeProject.name)}"`,
  );

  return {scheme, mode};
}
