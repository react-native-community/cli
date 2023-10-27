import chalk from 'chalk';
import {Device} from '../types';
import {prompt} from '@react-native-community/cli-tools';

export async function promptForSchemeSelection(
  schemes: string[],
): Promise<string> {
  const {scheme} = await prompt({
    name: 'scheme',
    type: 'select',
    message: 'Select the scheme you want to use',
    choices: schemes.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return scheme;
}

export async function promptForConfigurationSelection(
  configurations: string[],
): Promise<string> {
  const {configuration} = await prompt({
    name: 'configuration',
    type: 'select',
    message: 'Select the configuration you want to use',
    choices: configurations.map((value) => ({
      title: value,
      value: value,
    })),
  });

  return configuration;
}

export async function promptForDeviceSelection(
  availableDevices: Device[],
): Promise<Device | undefined> {
  const {device} = await prompt({
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
