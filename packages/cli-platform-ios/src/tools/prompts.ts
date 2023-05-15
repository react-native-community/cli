import chalk from 'chalk';
import prompts from 'prompts';
import {Device, IosProjectInfo} from '../types';

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

export async function promptForDeviceSelection(
  availableDevices: Device[],
): Promise<Device | undefined> {
  const {device} = await prompts({
    type: 'select',
    name: 'device',
    message: 'Select the device you want to use',
    choices: availableDevices
      .filter((d) => d.type === 'device' || d.type === 'simulator')
      .map((d) => ({
        title: `${chalk.bold(d.name)} ${
          !d.isAvailable && !!d.availabilityError
            ? chalk.red(`(unavailable - ${d.availabilityError})`)
            : ''
        }`,
        value: d,
        disabled: !d.isAvailable,
      })),
    min: 1,
  });
  return device;
}
