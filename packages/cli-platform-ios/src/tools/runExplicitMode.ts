import {logger} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {getProjectInfo} from './getProjectInfo';
import {
  promptForConfigurationSelection,
  promptForSchemeSelection,
} from './prompts';

interface Args {
  scheme?: string;
  mode?: string;
}

export async function runExplicitMode(args: Args): Promise<Args> {
  const project = getProjectInfo();

  let scheme = args.scheme;
  let mode = args.mode;

  if (project.schemes.length > 1) {
    scheme = await promptForSchemeSelection(project);
  } else {
    logger.info(
      `Automatically selected ${chalk.bold(project.schemes[0])} scheme.`,
    );
  }

  if (project.configurations.length > 1) {
    mode = await promptForConfigurationSelection(project);
  } else {
    logger.info(
      `Automatically selected ${chalk.bold(
        project.configurations[0],
      )} configuration.`,
    );
  }

  return {
    scheme,
    mode,
  };
}
