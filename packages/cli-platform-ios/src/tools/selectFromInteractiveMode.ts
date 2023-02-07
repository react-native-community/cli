import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {getProjectInfo} from './getProjectInfo';
import {
  promptForConfigurationSelection,
  promptForSchemeSelection,
} from './prompts';

interface Args {
  scheme: string;
  mode: string;
}

export async function selectFromInteractiveMode({
  scheme,
  mode,
}: Args): Promise<Args> {
  let newScheme = scheme;
  let newMode = mode;

  const project = getProjectInfo();

  if (project.schemes.length > 1) {
    newScheme = await promptForSchemeSelection(project);
  } else {
    logger.info(`Automatically selected ${chalk.bold(scheme)} scheme.`);
  }

  if (project.configurations.length > 1) {
    newMode = await promptForConfigurationSelection(project);
  } else {
    logger.info(`Automatically selected ${chalk.bold(mode)} configuration.`);
  }

  return {
    scheme: newScheme,
    mode: newMode,
  };
}
