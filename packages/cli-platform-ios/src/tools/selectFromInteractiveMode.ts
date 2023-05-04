import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {getProjectInfo} from './getProjectInfo';
import {
  promptForConfigurationSelection,
  promptForSchemeSelection,
  promptForTargetSelection,
} from './prompts';

interface Args {
  scheme: string;
  mode: string;
  target: string;
}

export async function selectFromInteractiveMode({
  scheme,
  mode,
  target,
}: Args): Promise<Args> {
  let newScheme = scheme;
  let newMode = mode;
  let newTarget = target;

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

  if (project.targets.length > 2) {
    newTarget = await promptForTargetSelection(project.targets, newScheme);
  } else {
    logger.info(`Automatically selected ${chalk.bold(newTarget)} target.`);
  }

  return {
    scheme: newScheme,
    mode: newMode,
    target: newTarget,
  };
}
