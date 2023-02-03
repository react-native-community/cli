import prompts from 'prompts';
import {IosProjectInfo} from '../types';

export async function promptForSchemeSelection(
  project: IosProjectInfo,
): Promise<string> {
  const {scheme} = await prompts({
    name: 'scheme',
    type: 'select',
    message: 'Select the scheme you want to use',
    choices: project.schemes.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return scheme;
}

export async function promptForConfigurationSelection(
  project: IosProjectInfo,
): Promise<string> {
  const {configuration} = await prompts({
    name: 'configuration',
    type: 'select',
    message: 'Select the configuration you want to use',
    choices: project.configurations.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return configuration;
}
