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
  devices: Device[],
  lastUsedDeviceId?: string,
): Promise<Device | undefined> {
  const sortedDevices = devices;
  const devicesIds = sortedDevices.map(({udid}) => udid);

  if (lastUsedDeviceId) {
    const preferredDeviceIndex = devicesIds.indexOf(lastUsedDeviceId);

    if (preferredDeviceIndex > -1) {
      const [preferredDevice] = sortedDevices.splice(preferredDeviceIndex, 1);
      sortedDevices.unshift(preferredDevice);
    }
  }

  const {device} = await prompt({
    type: 'select',
    name: 'device',
    message: 'Select the device you want to use',
    choices: sortedDevices
      .filter(({type}) => type === 'device' || type === 'simulator')
      .map((d) => {
        const version = d.version
          ? ` (${d.version.match(/^(\d+\.\d+)/)?.[1]})`
          : '';

        const availability =
          !d.isAvailable && !!d.availabilityError
            ? chalk.red(`(unavailable - ${d.availabilityError})`)
            : '';

        return {
          title: `${chalk.bold(`${d.name}${version}`)} ${availability}`,
          value: d,
          disabled: !d.isAvailable,
        };
      }),
    min: 1,
  });
  return device;
}
