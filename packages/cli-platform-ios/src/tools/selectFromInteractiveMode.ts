import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {IosInfo} from '../types';
import {
  promptForConfigurationSelection,
  promptForSchemeSelection,
} from './prompts';

interface Args {
  scheme?: string;
  mode?: string;
  info: IosInfo | undefined;
}

export async function selectFromInteractiveMode({
  scheme,
  mode,
  info,
}: Args): Promise<{scheme?: string; mode?: string}> {
  let newScheme = scheme;
  let newMode = mode;

  if (info && info?.schemes && info.schemes.length > 1) {
    newScheme = await promptForSchemeSelection(info.schemes);
  } else {
    logger.info(`Automatically selected ${chalk.bold(scheme)} scheme.`);
  }

  if (info && info?.configurations && info?.configurations?.length > 1) {
    newMode = await promptForConfigurationSelection(info.configurations);
  } else {
    logger.info(`Automatically selected ${chalk.bold(mode)} configuration.`);
  }

  return {
    scheme: newScheme,
    mode: newMode,
  };
}
