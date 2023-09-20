import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {IosProjectInfo} from '../types';
import {
  promptForConfigurationSelection,
  promptForSchemeSelection,
} from './prompts';

interface Args {
  scheme?: string;
  mode?: string;
  projectInfo: IosProjectInfo;
}

export async function selectFromInteractiveMode({
  scheme,
  mode,
  projectInfo,
}: Args): Promise<{scheme?: string; mode?: string}> {
  let newScheme = scheme;
  let newMode = mode;

  if (projectInfo.schemes.length > 1) {
    newScheme = await promptForSchemeSelection(projectInfo);
  } else {
    logger.info(`Automatically selected ${chalk.bold(scheme)} scheme.`);
  }

  if (projectInfo.configurations.length > 1) {
    newMode = await promptForConfigurationSelection(projectInfo);
  } else {
    logger.info(`Automatically selected ${chalk.bold(mode)} configuration.`);
  }

  return {
    scheme: newScheme,
    mode: newMode,
  };
}
