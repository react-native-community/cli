import {logger} from '@react-native-community/cli-tools';
import pico from 'picocolors';
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

  const schemes = info?.schemes;
  if (schemes && schemes.length > 1) {
    newScheme = await promptForSchemeSelection(schemes);
  } else {
    logger.info(`Automatically selected ${pico.bold(scheme)} scheme.`);
  }

  const configurations = info?.configurations;
  if (configurations && configurations.length > 1) {
    newMode = await promptForConfigurationSelection(configurations);
  } else {
    logger.info(`Automatically selected ${pico.bold(mode)} configuration.`);
  }

  return {
    scheme: newScheme,
    mode: newMode,
  };
}
